# Recomendación Actualizada: Manejo del bimestre_id y Cambios Temporales

## Problema Identificado

**Las carreras y sus categorías pueden cambiar de un bimestre a otro**, lo que genera problemas de consistencia temporal en el sistema de permisos.

### Ejemplos Problemáticos

1. **Cambios en estructura de carreras:**
   - Bimestre 1: Carrera "Ingeniería" tiene asignaturas [A, B, C]
   - Bimestre 2: Carrera "Ingeniería" tiene asignaturas [A, B, D] (C eliminada, D agregada)
   - Usuario con permiso a "Ingeniería" podría ver asignatura C del Bimestre 1 cuando consulta Bimestre 2

2. **Cambios en categorías:**
   - Bimestre 1: Asignatura X pertenece a categoría "BASICA"
   - Bimestre 2: Asignatura X pertenece a categoría "ESPECIALIDAD"
   - Usuario con permiso solo a "BASICA" podría acceder incorrectamente a X en Bimestre 2

## Análisis del Sistema Actual

### Problema Detectado
- Las tablas staging capturan correctamente los cambios temporales con `bimestre_id`
- Las tablas finales (`carreras`, `asignaturas`) se **sobrescriben** con cada carga
- Los permisos se basan en el estado **actual** de las tablas finales
- **Resultado**: Los permisos siempre reflejan el último bimestre cargado, no el bimestre consultado

## Solución Recomendada: Historial Temporal Completo

### Estrategia Principal
**Agregar `bimestre_id` tanto a las tablas finales como a las tablas de permisos para garantizar consistencia temporal completa.**

### Escenario Crítico Identificado

**Cambios de permisos entre bimestres:**
- Bimestre 1: Usuario tiene permiso para Carrera X
- Bimestre 2: Usuario tiene permiso para Carrera Y

**Problema**: Sin `bimestre_id` en permisos, el usuario vería datos incorrectos (ambas carreras en todos los bimestres o pérdida de acceso histórico).

### Cambios Requeridos

#### 1. Modificación de Tablas Finales

```sql
-- Agregar bimestre_id a carreras
ALTER TABLE carreras 
ADD COLUMN bimestre_id INT NOT NULL,
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
DROP INDEX codigo_plan,
ADD UNIQUE KEY unique_carrera_bimestre (codigo_plan, bimestre_id);

-- Agregar bimestre_id a asignaturas
ALTER TABLE asignaturas 
ADD COLUMN bimestre_id INT NOT NULL,
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
DROP INDEX unique_sigla_carrera,
ADD UNIQUE KEY unique_asignatura_bimestre (carrera_id, sigla, bimestre_id);
```

#### 2. Modificación de Tablas de Permisos

```sql
-- Agregar bimestre_id a usuario_permisos_carrera
ALTER TABLE usuario_permisos_carrera 
ADD COLUMN bimestre_id INT NOT NULL,
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
DROP INDEX unique_usuario_carrera,
ADD UNIQUE KEY unique_usuario_carrera_bimestre (usuario_id, carrera_id, bimestre_id);

-- Agregar bimestre_id a usuario_permisos_categoria
ALTER TABLE usuario_permisos_categoria 
ADD COLUMN bimestre_id INT NOT NULL,
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
DROP INDEX unique_usuario_categoria,
ADD UNIQUE KEY unique_usuario_categoria_bimestre (usuario_id, categoria, bimestre_id);

-- Agregar bimestre_id a permisos_pendientes
ALTER TABLE permisos_pendientes 
ADD COLUMN bimestre_id INT NOT NULL,
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);
```

#### 3. Modificación de la Lógica de Carga

**Antes (Problemático):**
```sql
-- Sobrescribe datos existentes
INSERT INTO carreras (codigo_plan, nombre_carrera) 
VALUES (...) 
ON DUPLICATE KEY UPDATE nombre_carrera = VALUES(nombre_carrera);
```

**Después (Correcto):**
```sql
-- Preserva historial por bimestre
INSERT IGNORE INTO carreras (codigo_plan, nombre_carrera, bimestre_id) 
VALUES (..., @current_bimestre_id);
```

#### 4. Actualización de Consultas

**Vista actualizada para permisos (con filtrado temporal completo):**
```sql
CREATE OR REPLACE VIEW usuario_asignaturas_permitidas AS
SELECT DISTINCT 
    u.id AS usuario_id,
    u.email_institucional AS usuario_mail,
    a.id AS asignatura_id,
    a.sigla,
    a.nombre AS asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    a.bimestre_id,
    'CARRERA' AS tipo_permiso
FROM users u
JOIN usuario_permisos_carrera upc ON u.id = upc.usuario_id
JOIN carreras c ON upc.carrera_id = c.id AND upc.bimestre_id = c.bimestre_id  -- CLAVE: Filtro temporal en permisos
JOIN asignaturas a ON c.id = a.carrera_id AND c.bimestre_id = a.bimestre_id
WHERE u.is_active = true AND upc.activo = true AND a.activo = true

UNION

SELECT DISTINCT 
    u.id AS usuario_id,
    u.email_institucional AS usuario_mail,
    a.id AS asignatura_id,
    a.sigla,
    a.nombre AS asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    a.bimestre_id,
    'CATEGORIA' AS tipo_permiso
FROM users u
JOIN usuario_permisos_categoria upcat ON u.id = upcat.usuario_id
JOIN asignaturas a ON upcat.categoria = a.categoria_asignatura AND upcat.bimestre_id = a.bimestre_id  -- CLAVE: Filtro temporal en permisos
JOIN carreras c ON a.carrera_id = c.id AND a.bimestre_id = c.bimestre_id
WHERE u.is_active = true AND upcat.activo = true AND a.activo = true;
```

**Consultas de datos con filtro temporal:**
```sql
-- Ejemplo: Obtener cursables para un usuario en un bimestre específico
SELECT sc.*
FROM staging_cursables sc
JOIN usuario_asignaturas_permitidas uap ON (
    sc.asignatura_sigla = uap.sigla AND 
    sc.bimestre_id = uap.bimestre_id  -- GARANTIZA: Solo datos del bimestre con permisos correctos
)
WHERE uap.usuario_id = ? AND sc.bimestre_id = ?;

-- Ejemplo: Verificar permisos específicos por bimestre
SELECT COUNT(*) as tiene_permiso
FROM usuario_permisos_carrera upc
JOIN carreras c ON upc.carrera_id = c.id AND upc.bimestre_id = c.bimestre_id
WHERE upc.usuario_id = ? AND c.codigo_plan = ? AND upc.bimestre_id = ? AND upc.activo = true;
```

### Ventajas de Esta Solución

1. ✅ **Precisión Temporal Completa**: Los permisos y datos se evalúan con la estructura correcta de cada bimestre
2. ✅ **Historial Completo**: Se preservan todos los cambios en carreras, asignaturas Y permisos
3. ✅ **Consistencia Temporal**: Los permisos son específicos por bimestre, evitando accesos incorrectos
4. ✅ **Consultas Precisas**: Los datos se filtran correctamente por bimestre en todos los niveles
5. ✅ **Escalabilidad**: Soporta múltiples bimestres y cambios de permisos entre ellos
6. ✅ **Flexibilidad**: Permite diferentes permisos para el mismo usuario en diferentes bimestres

### Impacto en el Sistema

#### Cambios Requeridos (Revisados)
- ✅ Modificación de esquema de BD (5 tablas: carreras, asignaturas, usuario_permisos_carrera, usuario_permisos_categoria, permisos_pendientes)
- ✅ Actualización de scripts de carga
- ✅ Actualización de vistas y consultas
- ✅ **SÍ requiere cambios en tablas de permisos** (para consistencia temporal)
- ❌ **NO requiere cambios en lógica de autenticación**

#### Migración de Datos Existentes
```sql
-- Asignar bimestre actual a datos existentes
UPDATE carreras SET bimestre_id = (SELECT id FROM bimestres WHERE activo = 1 LIMIT 1);
UPDATE asignaturas SET bimestre_id = (SELECT id FROM bimestres WHERE activo = 1 LIMIT 1);
```

## Implementación por Fases

### Fase 1: Preparación
1. Crear script de migración de esquema
2. Actualizar scripts de carga para preservar historial
3. Crear vistas temporales para testing

### Fase 2: Migración
1. Ejecutar migración de esquema
2. Migrar datos existentes al bimestre actual
3. Actualizar vistas de permisos

### Fase 3: Validación
1. Probar consultas con múltiples bimestres
2. Validar permisos por bimestre
3. Verificar rendimiento

## Conclusión Final

**La recomendación inicial era incorrecta** debido a que no consideraba:
1. Los cambios temporales en la estructura académica
2. Los cambios de permisos entre bimestres

**Recomendación final**: Agregar `bimestre_id` a TODAS las tablas relevantes:
- **Tablas finales**: `carreras`, `asignaturas` (para preservar historial de estructura)
- **Tablas de permisos**: `usuario_permisos_carrera`, `usuario_permisos_categoria`, `permisos_pendientes` (para consistencia temporal)

### Escenario Resuelto
**Usuario con Carrera X en Bimestre 1 y Carrera Y en Bimestre 2:**
- ✅ Bimestre 1: Ve solo asignaturas de Carrera X del bimestre 1
- ✅ Bimestre 2: Ve solo asignaturas de Carrera Y del bimestre 2
- ✅ Sin accesos cruzados incorrectos
- ✅ Historial completo preservado

Esta solución resuelve completamente el problema de consistencia temporal en todos los niveles del sistema.

---

**Fecha**: $(Get-Date -Format "yyyy-MM-dd")
**Estado**: Recomendación Actualizada - Crítica
**Impacto**: Cambios requeridos en esquema de BD