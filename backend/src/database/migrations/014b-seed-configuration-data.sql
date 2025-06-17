-- Migración: 014b-seed-configuration-data.sql
-- Descripción: Poblar tabla de configuraciones con datos iniciales
-- Fecha: 2025-06-17

INSERT INTO configuration (config_key, config_value, description, value_type, is_editable, category) VALUES
('max_teacher_hours_weekly', '40', 'Máximo de horas semanales que puede tener asignadas un docente', 'number', TRUE, 'scheduling'),
('time_unit', 'chronological_60', 'Unidad de tiempo para programación (chronological_60, academic_45)', 'string', TRUE, 'scheduling'),
('min_class_duration_minutes', '45', 'Duración mínima de una clase en minutos', 'number', TRUE, 'scheduling'),
('max_class_duration_minutes', '240', 'Duración máxima de una clase en minutos', 'number', TRUE, 'scheduling'),
('working_days', '["Lunes","Martes","Miércoles","Jueves","Viernes"]', 'Días laborales para programación académica', 'json', TRUE, 'scheduling'),
('working_hours_start', '07:00', 'Hora de inicio de jornada académica', 'time', TRUE, 'scheduling'),
('working_hours_end', '22:00', 'Hora de fin de jornada académica', 'time', TRUE, 'scheduling'),
('break_duration_minutes', '15', 'Duración del descanso entre clases en minutos', 'number', TRUE, 'scheduling'),
('allow_overlap_minutes', '0', 'Minutos de solapamiento permitidos entre eventos del mismo docente', 'number', TRUE, 'scheduling'),
('max_events_per_day_teacher', '8', 'Máximo número de eventos por día para un docente', 'number', TRUE, 'scheduling'),
('auto_approve_events', 'false', 'Si los eventos se aprueban automáticamente al crearlos', 'boolean', TRUE, 'scheduling'),
('calendar_view_default', 'week', 'Vista por defecto del calendario (day, week, month)', 'string', TRUE, 'ui'),
('enable_conflict_validation', 'true', 'Si se debe validar automáticamente conflictos de horario', 'boolean', TRUE, 'scheduling'),
('academic_year_current', '2025', 'Año académico actual', 'number', TRUE, 'academic'),
('academic_periods', '["2025-1","2025-2"]', 'Períodos académicos disponibles', 'json', TRUE, 'academic')
ON DUPLICATE KEY UPDATE
    config_value = VALUES(config_value),
    description = VALUES(description),
    value_type = VALUES(value_type),
    is_editable = VALUES(is_editable),
    category = VALUES(category),
    updated_at = CURRENT_TIMESTAMP;
