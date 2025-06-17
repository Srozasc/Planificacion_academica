-- Migración: 014-create-configuration-table.sql
-- Descripción: Tabla de configuraciones globales para el sistema de programación académica
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica

-- Crear tabla de configuraciones si no existe
CREATE TABLE IF NOT EXISTS configuration (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único de la configuración',
    
    -- Clave y valor de configuración
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT 'Clave única de configuración',
    config_value VARCHAR(500) NOT NULL COMMENT 'Valor de la configuración',
    description TEXT NULL COMMENT 'Descripción de qué hace esta configuración',
    
    -- Tipo de dato y validación
    value_type ENUM('string', 'number', 'boolean', 'json', 'date', 'time') NOT NULL DEFAULT 'string' COMMENT 'Tipo de dato del valor',
    is_editable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si la configuración puede editarse desde la UI',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si es una configuración crítica del sistema',
    
    -- Categorización
    category VARCHAR(50) NOT NULL DEFAULT 'general' COMMENT 'Categoría de la configuración',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    updated_by INT NULL COMMENT 'ID del usuario que actualizó la configuración',
    
    -- Clave foránea
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices para optimización
    INDEX idx_configuration_category (category),
    INDEX idx_configuration_editable (is_editable),
    INDEX idx_configuration_system (is_system)
) 
ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci 
COMMENT='Configuraciones globales del sistema de planificación académica';

-- Separador para ejecutar en múltiples statements
-- Insertar configuraciones iniciales para el calendario académico
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
    category = VALUES(category),    updated_at = CURRENT_TIMESTAMP;
