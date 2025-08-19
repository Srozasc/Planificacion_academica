# Análisis del Método deleteWithEvents

## Resumen

Este documento analiza el método `deleteWithEvents` existente en el servicio de bimestres para extraer la lógica que se puede reutilizar en el Stored Procedure de limpieza anual.

## Estructura del Método Actual

### 1. Método checkDependencies()

**Propósito**: Verificar qué tablas tienen registros relacionados con un bimestre específico.

**Lógica**:
```typescript
// 1. Inicializar contador de dependencias
const dependencies = {
  hasEvents: false,
  eventCount: 0,
  tables: [] as string[]
};

// 2. Verificar staging_dol específicamente
// 3. Verificar schedule_events con manejo de errores
// 4. Iterar sobre lista de tablas relacionadas
// 5. Contar registros y agregar a lista si > 0
```

**Tablas verificadas**:
- `staging_dol` (verificación específica)
- `schedule_events` (con try-catch)
- Lista de tablas relacionadas (14 tablas)

### 2. Método deleteWithEvents()

**Propósito**: Eliminar un bimestre específico y todas sus dependencias.

**Flujo de ejecución**:
1. Verificar que el bimestre existe (`findById`)
2. Obtener dependencias (`checkDependencies`)
3. Definir orden de eliminación
4. Eliminar registros tabla por tabla
5. Eliminar el bimestre principal
6. Logging detallado

## Orden de Eliminación Definido

```typescript
const tablesToClean = [
  // 1. Tablas de permisos (eliminar primero)
  { name: 'usuario_permisos_carrera', column: 'bimestre_id' },
  { name: 'usuario_permisos_categoria', column: 'bimestre_id' },
  { name: 'permisos_pendientes', column: 'bimestre_id' },
  
  // 2. Tablas staging
  { name: 'staging_dol', column: 'id_bimestre' },
  { name: 'staging_cursables', column: 'id_bimestre' },
  { name: 'staging_docentes', column: 'id_bimestre' },
  { name: 'staging_estructura_academica', column: 'id_bimestre' },
  { name: 'staging_usuarios_agendador', column: 'id_bimestre' },
  { name: 'staging_vacantes', column: 'id_bimestre' },
  { name: 'staging_adol', column: 'id_bimestre' },
  
  // 3. Tabla de eventos
  { name: 'schedule_events', column: 'bimestre_id' },
  
  // 4. Tablas finales (eliminar después de staging)
  { name: 'asignaturas', column: 'bimestre_id' },
  { name: 'carreras', column: 'bimestre_id' }
];
```

## Características Clave para Reutilizar

### 1. Manejo de Errores Gracioso
```typescript
try {
  const result = await this.bimestreRepository.query(
    `DELETE FROM ${table.name} WHERE ${table.column} = ?`,
    [id]
  );
  // Procesar resultado
} catch (error) {
  // Continuar con otras tablas aunque una falle
  this.logger.warn(`Error al eliminar de ${table.name}:`, error.message);
}
```

### 2. Conteo de Registros Eliminados
```typescript
const deleted = result.affectedRows || 0;
if (deleted > 0) {
  this.logger.log(`Eliminados ${deleted} registros de ${table.name}`);
  totalDeleted += deleted;
}
```

### 3. Logging Detallado
- Log de inicio de proceso
- Log por cada tabla procesada
- Log de total de registros eliminados
- Log de bimestre eliminado
- Log de errores específicos

## Adaptación para Stored Procedure

### Diferencias Clave

| Aspecto | Método Actual | Stored Procedure |
|---------|---------------|------------------|
| **Alcance** | Un bimestre específico | Múltiples bimestres antiguos |
| **Selección** | Por ID directo | Por criterio de antigüedad |
| **Validación** | Verificar existencia | Verificar cantidad mínima |
| **Transacciones** | Implícita por NestJS | Explícita en SP |
| **Logging** | Logger de NestJS | Variables y SELECT |

### Lógica Reutilizable

1. **Orden de eliminación**: Usar exactamente el mismo orden
2. **Manejo de errores**: Continuar aunque una tabla falle
3. **Conteo de registros**: Mantener estadísticas
4. **Estructura iterativa**: Procesar tabla por tabla

### Adaptaciones Necesarias

1. **Selección de bimestres**:
```sql
-- En lugar de WHERE bimestre_id = ?
WHERE bimestre_id IN (
  SELECT id FROM bimestres_to_delete
)
```

2. **Validación inicial**:
```sql
-- Verificar que hay suficientes bimestres
IF (SELECT COUNT(*) FROM bimestres) <= @bimestres_a_mantener THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay suficientes bimestres para eliminar';
END IF;
```

3. **Identificación de bimestres antiguos**:
```sql
-- Crear tabla temporal con bimestres a eliminar
CREATE TEMPORARY TABLE bimestres_to_delete AS
SELECT id 
FROM bimestres 
ORDER BY createdAt DESC 
LIMIT 18446744073709551615 OFFSET @bimestres_a_mantener;
```

## Estructura Propuesta del Stored Procedure

```sql
DELIMITER //
CREATE PROCEDURE sp_cleanup_old_bimestres(
    IN p_bimestres_a_mantener INT DEFAULT 10
)
BEGIN
    DECLARE v_total_bimestres INT DEFAULT 0;
    DECLARE v_bimestres_eliminados INT DEFAULT 0;
    DECLARE v_registros_eliminados INT DEFAULT 0;
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 1. Validaciones iniciales
    -- 2. Crear tabla temporal con bimestres a eliminar
    -- 3. Eliminar dependencias en orden (reutilizar lógica)
    -- 4. Eliminar bimestres principales
    -- 5. Logging de resultados
    
    COMMIT;
END //
DELIMITER ;
```

## Tablas Faltantes en el Método Actual

Basándose en el análisis de dependencias, estas tablas no están incluidas en `deleteWithEvents`:

- `event_teachers` (con `id_bimestre`)
- `upload_logs` (con `bimestre_id`)
- `dol_aprobados` (con `id_bimestre`)
- `asignaturas_optativas_aprobadas` (con `id_bimestre`)

**Recomendación**: Incluir estas tablas en el stored procedure.

## Orden de Eliminación Actualizado

```sql
-- 1. Tablas de permisos
'usuario_permisos_carrera',
'usuario_permisos_categoria', 
'permisos_pendientes',

-- 2. Tablas staging
'staging_dol',
'staging_cursables',
'staging_docentes', 
'staging_estructura_academica',
'staging_usuarios_agendador',
'staging_vacantes',
'staging_adol',

-- 3. Tablas de eventos
'event_teachers',  -- NUEVA
'schedule_events',

-- 4. Tablas finales
'dol_aprobados',   -- NUEVA
'asignaturas_optativas_aprobadas', -- NUEVA
'asignaturas',
'carreras',

-- 5. Tablas de logs
'upload_logs',     -- NUEVA

-- 6. Tabla principal
'bimestres'
```

## Próximos Pasos

1. ✅ Analizar método `deleteWithEvents` - **COMPLETADO**
2. ⏳ Verificar permisos de base de datos
3. ⏳ Definir criterios de ordenamiento
4. ⏳ Desarrollar stored procedure
5. ⏳ Crear servicio NestJS

---

**Fecha de creación**: 2025-01-30  
**Fase**: 1.3 - Análisis y Preparación  
**Estado**: Completado