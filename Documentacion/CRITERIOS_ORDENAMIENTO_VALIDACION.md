# Criterios de Ordenamiento y Validación para Limpieza de Bimestres

## Análisis de Datos Actuales

### Estado Actual de la Base de Datos
- **Total de bimestres**: 5 registros
- **Rango de años académicos**: 2025-2026
- **Primer registro**: 2025-07-30 21:32:53
- **Último registro**: 2025-07-30 21:32:53
- **Todos los bimestres están activos**: `activo = 1`

### Observaciones Importantes
1. **Fecha inconsistente**: El bimestre ID 20 tiene fechas de 1916 (posible error de datos)
2. **Datos recientes**: Todos los bimestres fueron creados el mismo día (30 julio 2025)
3. **Sistema nuevo**: La base de datos parece contener datos de prueba o iniciales

## Criterios de Ordenamiento

### 1. Criterio Principal: Antigüedad por Fecha de Creación
```sql
ORDER BY createdAt ASC
```
**Justificación**: Los bimestres más antiguos deben eliminarse primero para mantener los datos más recientes.

### 2. Criterio Secundario: Año Académico y Número de Bimestre
```sql
ORDER BY anoAcademico ASC, numeroBimestre ASC
```
**Justificación**: En caso de empate en fechas de creación, priorizar por orden cronológico académico.

### 3. Criterio de Desempate: ID del Bimestre
```sql
ORDER BY id ASC
```
**Justificación**: Garantizar un orden determinístico y reproducible.

### Orden Final Propuesto
```sql
SELECT id FROM bimestres 
WHERE activo = 0 OR fechaFin < DATE_SUB(NOW(), INTERVAL @meses_antiguedad MONTH)
ORDER BY createdAt ASC, anoAcademico ASC, numeroBimestre ASC, id ASC
```

## Criterios de Validación

### 1. Validaciones Previas a la Eliminación

#### A. Validación de Antigüedad
- **Parámetro**: `@meses_antiguedad` (recomendado: 24 meses)
- **Condición**: `fechaFin < DATE_SUB(NOW(), INTERVAL @meses_antiguedad MONTH)`
- **Propósito**: Solo eliminar bimestres que hayan finalizado hace más de X meses

#### B. Validación de Estado
- **Condición**: `activo = 0` OR cumple criterio de antigüedad
- **Propósito**: Respetar bimestres marcados como activos a menos que sean muy antiguos

#### C. Validación de Integridad de Fechas
- **Condición**: `fechaInicio IS NOT NULL AND fechaFin IS NOT NULL`
- **Condición**: `fechaFin > fechaInicio`
- **Propósito**: Evitar eliminar registros con datos inconsistentes sin revisión

### 2. Validaciones de Seguridad

#### A. Límite de Eliminación por Ejecución
- **Parámetro**: `@max_bimestres_por_ejecucion` (recomendado: 10)
- **Propósito**: Evitar eliminaciones masivas accidentales

#### B. Validación de Dependencias Críticas
- **Verificar**: Existencia de registros en tablas dependientes
- **Acción**: Registrar advertencias antes de proceder

#### C. Validación de Backup
- **Verificar**: Que exista un backup reciente de la base de datos
- **Recomendación**: Ejecutar backup antes de la limpieza

### 3. Validaciones Post-Eliminación

#### A. Verificación de Integridad Referencial
```sql
-- Verificar que no queden referencias huérfanas
SELECT COUNT(*) FROM schedule_events se 
LEFT JOIN bimestres b ON se.bimestre_id = b.id 
WHERE b.id IS NULL;
```

#### B. Conteo de Registros Eliminados
- **Registrar**: Número exacto de bimestres eliminados
- **Registrar**: Número de registros eliminados por tabla dependiente

## Parámetros Configurables

### Variables del Stored Procedure
```sql
DECLARE meses_antiguedad INT DEFAULT 24;
DECLARE max_bimestres_por_ejecucion INT DEFAULT 10;
DECLARE modo_debug BOOLEAN DEFAULT FALSE;
DECLARE realizar_backup BOOLEAN DEFAULT TRUE;
```

### Configuración Recomendada por Ambiente

#### Producción
- `meses_antiguedad`: 36 meses
- `max_bimestres_por_ejecucion`: 5
- `modo_debug`: FALSE
- `realizar_backup`: TRUE

#### Desarrollo/Testing
- `meses_antiguedad`: 12 meses
- `max_bimestres_por_ejecucion`: 20
- `modo_debug`: TRUE
- `realizar_backup`: FALSE

## Casos Especiales

### 1. Bimestres con Fechas Inconsistentes
- **Ejemplo**: Bimestre ID 20 con fechas de 1916
- **Acción**: Marcar para revisión manual antes de eliminación automática
- **Criterio**: `fechaInicio < '2000-01-01' OR fechaFin < '2000-01-01'`

### 2. Bimestres Activos Muy Antiguos
- **Criterio**: `activo = 1 AND fechaFin < DATE_SUB(NOW(), INTERVAL 60 MONTH)`
- **Acción**: Generar alerta para revisión manual

### 3. Bimestres Sin Dependencias
- **Verificar**: Bimestres que no tienen registros relacionados
- **Acción**: Pueden eliminarse con menor restricción de antigüedad

## Logging y Auditoría

### Información a Registrar
1. **Timestamp de ejecución**
2. **Parámetros utilizados**
3. **Bimestres identificados para eliminación**
4. **Conteo de registros eliminados por tabla**
5. **Errores o advertencias**
6. **Tiempo total de ejecución**

### Formato de Log Propuesto
```sql
INSERT INTO cleanup_logs (fecha_ejecucion, tipo_operacion, parametros, 
                         bimestres_eliminados, registros_afectados, 
                         errores, tiempo_ejecucion)
VALUES (NOW(), 'CLEANUP_BIMESTRES', JSON_OBJECT(...), ...);
```

## Próximos Pasos

1. **Crear tabla de logs** para auditoría de limpiezas
2. **Implementar stored procedure** con estos criterios
3. **Crear scripts de testing** para validar el comportamiento
4. **Configurar job de cron** con parámetros de producción
5. **Documentar procedimiento de rollback** en caso de errores

## Recomendaciones Finales

1. **Ejecutar en modo debug** inicialmente para validar selección
2. **Realizar backup completo** antes de la primera ejecución en producción
3. **Monitorear logs** después de cada ejecución automática
4. **Revisar criterios** trimestralmente según crecimiento de datos
5. **Mantener al menos 2 años** de datos históricos por defecto