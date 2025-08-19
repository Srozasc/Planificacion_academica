# Procedimientos de Rollback y Recuperación - Sistema de Limpieza de Bimestres

## Índice
1. [Introducción](#introducción)
2. [Procedimientos de Rollback](#procedimientos-de-rollback)
3. [Procedimientos de Recuperación](#procedimientos-de-recuperación)
4. [Monitoreo y Alertas](#monitoreo-y-alertas)
5. [Casos de Emergencia](#casos-de-emergencia)
6. [Contactos y Escalación](#contactos-y-escalación)

## Introducción

Este documento describe los procedimientos para realizar rollback y recuperación en caso de problemas con el sistema de limpieza automática de bimestres. Es fundamental seguir estos procedimientos para mantener la integridad de los datos académicos.

## Procedimientos de Rollback

### 1. Identificación de Problemas

#### Síntomas que requieren rollback:
- Eliminación accidental de bimestres activos
- Pérdida de datos críticos de planificación académica
- Errores en la integridad referencial
- Fallos en el proceso de limpieza que afecten la operación normal

#### Verificación inicial:
```sql
-- Verificar últimas ejecuciones del cleanup
SELECT * FROM cleanup_logs 
ORDER BY execution_date DESC 
LIMIT 10;

-- Verificar integridad de bimestres activos
SELECT COUNT(*) as total_bimestres,
       COUNT(CASE WHEN activo = 1 THEN 1 END) as bimestres_activos
FROM bimestres;
```

### 2. Rollback Inmediato

#### Paso 1: Detener procesos automáticos
```bash
# Detener el servidor NestJS si es necesario
npm run stop

# O deshabilitar solo el cron job
# Comentar el decorador @Cron en BimestreCleanupService
```

#### Paso 2: Restaurar desde backup
```sql
-- Si existe backup automático del día
SOURCE /path/to/backup/planificacion_academica_YYYYMMDD.sql;

-- O restaurar tablas específicas
SOURCE /path/to/backup/bimestres_backup_YYYYMMDD.sql;
SOURCE /path/to/backup/academic_structures_backup_YYYYMMDD.sql;
```

#### Paso 3: Verificar integridad post-rollback
```sql
-- Script de verificación de integridad
CALL sp_verify_database_integrity();

-- Verificar relaciones críticas
SELECT 
    'academic_structures' as tabla,
    COUNT(*) as registros_huerfanos
FROM academic_structures a
LEFT JOIN bimestres b ON a.id_bimestre = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 
    'schedule_events' as tabla,
    COUNT(*) as registros_huerfanos
FROM schedule_events s
LEFT JOIN bimestres b ON s.id_bimestre = b.id
WHERE b.id IS NULL;
```

### 3. Rollback Granular

#### Restaurar bimestres específicos:
```sql
-- Restaurar un bimestre específico desde backup
INSERT INTO bimestres (id, nombre, fecha_inicio, fecha_fin, activo, created_at, updated_at)
SELECT id, nombre, fecha_inicio, fecha_fin, activo, created_at, updated_at
FROM bimestres_backup
WHERE id = [BIMESTRE_ID];

-- Restaurar datos relacionados
INSERT INTO academic_structures 
SELECT * FROM academic_structures_backup 
WHERE id_bimestre = [BIMESTRE_ID];
```

## Procedimientos de Recuperación

### 1. Recuperación de Datos Eliminados

#### Desde logs de cleanup:
```sql
-- Consultar detalles de la eliminación
SELECT 
    cl.execution_id,
    cl.execution_date,
    cl.bimestres_deleted,
    cl.total_records_deleted,
    cl.parameters_used
FROM cleanup_logs cl
WHERE cl.execution_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY cl.execution_date DESC;

-- Si el SP guardó detalles de eliminación
SELECT deleted_bimestre_id, deleted_records_count
FROM cleanup_details 
WHERE execution_id = '[EXECUTION_ID]';
```

#### Recrear estructura de bimestre:
```sql
-- Recrear bimestre eliminado
INSERT INTO bimestres (nombre, fecha_inicio, fecha_fin, activo)
VALUES ('[NOMBRE_BIMESTRE]', '[FECHA_INICIO]', '[FECHA_FIN]', 0);

-- Nota: Los datos relacionados deberán ser reimportados desde fuentes originales
```

### 2. Recuperación de Integridad Referencial

#### Identificar y corregir referencias rotas:
```sql
-- Crear procedimiento de reparación
DELIMITER //
CREATE PROCEDURE sp_repair_referential_integrity()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE orphan_count INT;
    
    -- Eliminar registros huérfanos en academic_structures
    DELETE a FROM academic_structures a
    LEFT JOIN bimestres b ON a.id_bimestre = b.id
    WHERE b.id IS NULL;
    
    SELECT ROW_COUNT() as academic_structures_cleaned;
    
    -- Eliminar registros huérfanos en schedule_events
    DELETE s FROM schedule_events s
    LEFT JOIN bimestres b ON s.id_bimestre = b.id
    WHERE b.id IS NULL;
    
    SELECT ROW_COUNT() as schedule_events_cleaned;
    
    -- Repetir para otras tablas relacionadas
END //
DELIMITER ;
```

### 3. Recuperación de Configuración

#### Restaurar configuración del cron job:
```typescript
// En BimestreCleanupService, verificar configuración
@Cron('0 2 1 1 *', {
  name: 'annual-bimestre-cleanup',
  timeZone: 'America/Mexico_City',
})
async executeAnnualCleanup(): Promise<void> {
  // Verificar que la configuración sea correcta
}
```

## Monitoreo y Alertas

### 1. Configurar Alertas Automáticas

#### Alertas por email (implementar en el servicio):
```typescript
// En BimestreCleanupService
private async sendAlert(type: 'success' | 'error' | 'warning', message: string) {
  // Implementar notificación por email
  // Para errores críticos, enviar inmediatamente
  // Para éxitos, enviar resumen diario
}
```

#### Métricas a monitorear:
- Número de bimestres eliminados por ejecución
- Tiempo de ejecución del proceso
- Errores en la ejecución
- Integridad referencial post-limpieza

### 2. Dashboard de Monitoreo

#### Consultas para dashboard:
```sql
-- Estado general del sistema
SELECT 
    COUNT(*) as total_bimestres,
    COUNT(CASE WHEN activo = 1 THEN 1 END) as bimestres_activos,
    MIN(fecha_inicio) as bimestre_mas_antiguo,
    MAX(fecha_fin) as bimestre_mas_reciente
FROM bimestres;

-- Historial de limpiezas
SELECT 
    DATE(execution_date) as fecha,
    COUNT(*) as ejecuciones,
    SUM(bimestres_deleted) as total_eliminados,
    AVG(execution_time_seconds) as tiempo_promedio
FROM cleanup_logs
WHERE execution_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(execution_date)
ORDER BY fecha DESC;
```

## Casos de Emergencia

### 1. Pérdida Total de Datos

#### Procedimiento de emergencia:
1. **Inmediato**: Detener todos los servicios
2. **Evaluación**: Determinar alcance de la pérdida
3. **Restauración**: Usar backup más reciente disponible
4. **Verificación**: Ejecutar scripts de integridad completos
5. **Comunicación**: Notificar a stakeholders

#### Script de restauración completa:
```bash
#!/bin/bash
# emergency_restore.sh

echo "Iniciando restauración de emergencia..."

# Detener servicios
sudo systemctl stop planificacion-academica

# Restaurar base de datos
mysql -u root -p planificacion_academica < /backup/latest/full_backup.sql

# Verificar integridad
mysql -u root -p planificacion_academica < /scripts/verify_integrity.sql

# Reiniciar servicios
sudo systemctl start planificacion-academica

echo "Restauración completada. Verificar logs."
```

### 2. Corrupción de Datos

#### Identificación de corrupción:
```sql
-- Verificar consistencia de fechas
SELECT * FROM bimestres 
WHERE fecha_inicio > fecha_fin 
   OR fecha_inicio IS NULL 
   OR fecha_fin IS NULL;

-- Verificar duplicados
SELECT nombre, COUNT(*) 
FROM bimestres 
GROUP BY nombre 
HAVING COUNT(*) > 1;
```

#### Procedimiento de reparación:
```sql
-- Reparar fechas inconsistentes
UPDATE bimestres 
SET fecha_fin = DATE_ADD(fecha_inicio, INTERVAL 2 MONTH)
WHERE fecha_inicio > fecha_fin;

-- Eliminar duplicados (mantener el más reciente)
DELETE b1 FROM bimestres b1
INNER JOIN bimestres b2 
WHERE b1.id < b2.id 
  AND b1.nombre = b2.nombre;
```

## Contactos y Escalación

### Niveles de Escalación

1. **Nivel 1 - Administrador de Sistema**
   - Problemas menores de configuración
   - Ajustes en parámetros de limpieza
   - Tiempo de respuesta: 2 horas

2. **Nivel 2 - Administrador de Base de Datos**
   - Problemas de integridad referencial
   - Restauraciones desde backup
   - Tiempo de respuesta: 1 hora

3. **Nivel 3 - Equipo de Desarrollo**
   - Bugs en el código del sistema
   - Modificaciones al Stored Procedure
   - Tiempo de respuesta: 4 horas

4. **Nivel 4 - Gerencia Técnica**
   - Pérdida crítica de datos
   - Decisiones de rollback mayor
   - Tiempo de respuesta: 30 minutos

### Información de Contacto

```
Administrador de Sistema: admin@institucion.edu
Administrador de BD: dba@institucion.edu
Equipo de Desarrollo: dev-team@institucion.edu
Gerencia Técnica: tech-manager@institucion.edu
Soporte 24/7: +52-xxx-xxx-xxxx
```

### Plantilla de Reporte de Incidente

```
FECHA/HORA: [YYYY-MM-DD HH:MM:SS]
SEVERIDAD: [Crítica/Alta/Media/Baja]
DESCRIPCIÓN: [Descripción detallada del problema]
IMPACTO: [Sistemas/usuarios afectados]
ACCIONES TOMADAS: [Pasos ejecutados hasta el momento]
ESTADO ACTUAL: [Estado del sistema]
SIGUIENTES PASOS: [Acciones planificadas]
REPORTADO POR: [Nombre y contacto]
```

---

**Nota**: Este documento debe ser revisado y actualizado cada 6 meses o después de cada incidente mayor. Mantener copias impresas en ubicaciones seguras para casos de emergencia donde no se tenga acceso digital.