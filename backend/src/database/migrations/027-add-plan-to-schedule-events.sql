-- Migración 027: Agregar columna 'plan' a la tabla schedule_events
-- Fecha: 2024
-- Descripción: Agrega la columna 'plan' para almacenar el plan académico asociado al evento

-- Agregar columna 'plan' a la tabla schedule_events
ALTER TABLE schedule_events 
ADD COLUMN plan VARCHAR(20) NULL COMMENT 'Plan académico asociado al evento';

-- Crear índice para mejorar el rendimiento de consultas por plan
CREATE INDEX idx_schedule_events_plan ON schedule_events(plan);

-- Comentario de finalización
-- La columna 'plan' permitirá almacenar y filtrar eventos por plan académico específico
-- Esto resuelve el problema donde eventos creados con un plan específico
-- aparecían con un plan diferente en el panel de eventos programados