-- =============================================
-- Script: 013-add-horas-to-schedule-events.sql
-- Propósito: Agregar campo 'horas' a la tabla schedule_events para eventos ADOL
-- Fecha: 2025-01-08
-- =============================================

USE planificacion_academica;

-- Agregar campo 'horas' a la tabla schedule_events
ALTER TABLE schedule_events 
ADD COLUMN horas DECIMAL(4,2) NULL COMMENT 'Cantidad de horas del evento (específico para eventos ADOL)' 
AFTER students;

-- Agregar constraint para validar que las horas sean positivas
ALTER TABLE schedule_events 
ADD CONSTRAINT chk_horas_positive 
CHECK (horas IS NULL OR horas > 0);

-- Agregar índice para consultas por horas
ALTER TABLE schedule_events 
ADD INDEX idx_horas (horas);

-- Verificar que la columna se agregó correctamente
DESCRIBE schedule_events;

SELECT 'Campo horas agregado exitosamente a schedule_events' AS status;