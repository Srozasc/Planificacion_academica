-- =============================================
-- Script: run-scheduling-migrations.sql
-- Propósito: Ejecutar todas las migraciones relacionadas con scheduling
-- Fecha: 2025-01-20
-- =============================================

-- Ejecutar migración de tabla de eventos
SOURCE 012-create-schedule-events-table.sql;

-- Verificar que la tabla se creó correctamente
DESCRIBE schedule_events;

-- Mostrar eventos de ejemplo insertados
SELECT * FROM schedule_events WHERE active = TRUE;

-- Verificar índices creados
SHOW INDEX FROM schedule_events;

-- Verificar triggers creados
SHOW TRIGGERS LIKE 'schedule_events';

-- Verificar vista creada
DESCRIBE v_schedule_events_active;

-- Verificar procedimientos almacenados
SHOW PROCEDURE STATUS LIKE 'sp_GetEventsByDateRange';

-- Verificar funciones
SHOW FUNCTION STATUS LIKE 'fn_CheckRoomConflict';

SELECT 'Migraciones de scheduling completadas exitosamente' AS status;
