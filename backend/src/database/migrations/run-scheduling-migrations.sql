-- Script para ejecutar todas las migraciones de programación académica
-- run-scheduling-migrations.sql
-- Fecha: 2025-06-17
-- Descripción: Ejecuta todas las migraciones relacionadas con la programación académica colaborativa

-- Configurar el entorno
SET foreign_key_checks = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Mostrar inicio
SELECT 'Iniciando migraciones de programación académica...' AS status, NOW() AS timestamp;

-- Migración 011: Crear tabla event_statuses
SELECT 'Ejecutando migración 011: event_statuses' AS status;
SOURCE 011-create-event-statuses-table.sql;

-- Migración 012: Crear tabla schedule_events  
SELECT 'Ejecutando migración 012: schedule_events' AS status;
SOURCE 012-create-schedule-events-table.sql;

-- Migración 013: Poblar event_statuses con datos iniciales
SELECT 'Ejecutando migración 013: datos iniciales event_statuses' AS status;
SOURCE 013-seed-event-statuses-data.sql;

-- Migración 014: Crear tabla configuration
SELECT 'Ejecutando migración 014: configuration' AS status;
SOURCE 014-create-configuration-table.sql;

-- Restaurar configuración
SET foreign_key_checks = 1;

-- Verificación final
SELECT 'Verificando tablas creadas...' AS status;

-- Verificar que todas las tablas existen
SELECT 
    TABLE_NAME,
    TABLE_COMMENT,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('event_statuses', 'schedule_events', 'configuration')
ORDER BY TABLE_NAME;

-- Verificar foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('schedule_events', 'configuration')
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Mostrar resumen final
SELECT 
    'Migraciones de programación académica completadas exitosamente' AS status,
    NOW() AS timestamp,
    (
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('event_statuses', 'schedule_events', 'configuration')
    ) AS tablas_creadas;
