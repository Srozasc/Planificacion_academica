-- =============================================
-- Script: run-event-teachers-migration.sql
-- Propósito: Ejecutar la migración para añadir id_bimestre a event_teachers
-- Fecha: 2025-01-30
-- =============================================

-- Verificar conexión a la base de datos
SELECT 'Conectado a la base de datos planificacion_academica' AS status;

-- Mostrar estructura actual de event_teachers
SELECT 'Estructura ANTES de la migración:' AS info;
DESCRIBE event_teachers;

-- Ejecutar la migración
SOURCE 018-add-bimestre-id-to-event-teachers.sql;

-- Verificar que la migración se ejecutó correctamente
SELECT 'Estructura DESPUÉS de la migración:' AS info;
DESCRIBE event_teachers;

-- Mostrar índices de la tabla
SELECT 'Índices de la tabla event_teachers:' AS info;
SHOW INDEX FROM event_teachers;

-- Verificar foreign keys
SELECT 'Foreign keys de la tabla event_teachers:' AS info;
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'event_teachers' 
  AND TABLE_SCHEMA = 'planificacion_academica'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Mostrar estadísticas de la tabla
SELECT 
    'event_teachers' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN id_bimestre IS NOT NULL THEN 1 END) as registros_con_bimestre,
    COUNT(CASE WHEN id_bimestre IS NULL THEN 1 END) as registros_sin_bimestre
FROM event_teachers;

SELECT 'Migración de event_teachers completada exitosamente' AS resultado;