-- Migración: 012-create-schedule-events-table.sql
-- Descripción: Tabla principal para eventos de programación académica
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica

CREATE TABLE IF NOT EXISTS schedule_events (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único del evento de programación',
    
    -- Relaciones con otras entidades
    academic_structure_id INT NOT NULL COMMENT 'ID de la estructura académica (asignatura)',
    teacher_id INT NOT NULL COMMENT 'ID del docente asignado',
    area_id INT NOT NULL COMMENT 'ID del programa/área académica',
    
    -- Información temporal del evento
    start_datetime DATETIME NOT NULL COMMENT 'Fecha y hora de inicio del evento',
    end_datetime DATETIME NOT NULL COMMENT 'Fecha y hora de fin del evento',
    day_of_week VARCHAR(10) NOT NULL COMMENT 'Día de la semana (Lunes, Martes, etc.)',
    
    -- Información del aula y capacidad
    classroom VARCHAR(50) NULL COMMENT 'Aula o salón asignado',
    vacancies INT NULL COMMENT 'Cantidad de cupos disponibles',
    max_capacity INT NULL COMMENT 'Capacidad máxima del aula',
    
    -- Estado y aprobación
    status_id INT NOT NULL DEFAULT 1 COMMENT 'Estado del evento (FK a event_statuses)',
    approval_comment TEXT NULL COMMENT 'Comentarios de aprobación/rechazo',
    approved_by INT NULL COMMENT 'ID del usuario que aprobó',
    approved_at TIMESTAMP NULL COMMENT 'Fecha de aprobación',
    
    -- Información académica adicional
    weekly_hours DECIMAL(4,2) NULL COMMENT 'Horas semanales de la asignatura',
    academic_period VARCHAR(20) NULL COMMENT 'Período académico (2025-1, 2025-2, etc.)',
    section VARCHAR(10) NULL COMMENT 'Sección de la asignatura (A, B, C, etc.)',
    
    -- Configuración del evento
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si el evento se repite semanalmente',
    recurrence_end_date DATE NULL COMMENT 'Fecha límite de recurrencia',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el evento está activo',
    
    -- Validaciones y restricciones
    conflicts_checked BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si se verificaron conflictos de horario',
    validation_notes TEXT NULL COMMENT 'Notas de validación automática',
    
    -- Auditoría y trazabilidad
    created_by_user_id INT NOT NULL COMMENT 'ID del usuario que creó el evento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    deleted_at TIMESTAMP NULL COMMENT 'Fecha de eliminación lógica',
    
    -- Claves foráneas
    FOREIGN KEY (academic_structure_id) REFERENCES academic_structures(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES event_statuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices para optimización de consultas
    INDEX idx_schedule_events_teacher (teacher_id),
    INDEX idx_schedule_events_academic_structure (academic_structure_id),
    INDEX idx_schedule_events_datetime (start_datetime, end_datetime),
    INDEX idx_schedule_events_day (day_of_week),
    INDEX idx_schedule_events_status (status_id),
    INDEX idx_schedule_events_area (area_id),
    INDEX idx_schedule_events_period (academic_period),
    INDEX idx_schedule_events_active (is_active),
    INDEX idx_schedule_events_created_by (created_by_user_id),
    
    -- Índices compuestos para consultas frecuentes
    INDEX idx_schedule_events_teacher_datetime (teacher_id, start_datetime, end_datetime),
    INDEX idx_schedule_events_area_period (area_id, academic_period),
    INDEX idx_schedule_events_status_active (status_id, is_active),
    
    -- Restricciones de validación
    CONSTRAINT chk_datetime_order CHECK (end_datetime > start_datetime),
    CONSTRAINT chk_day_of_week CHECK (day_of_week IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
    CONSTRAINT chk_vacancies CHECK (vacancies IS NULL OR vacancies >= 0),
    CONSTRAINT chk_max_capacity CHECK (max_capacity IS NULL OR max_capacity > 0),
    CONSTRAINT chk_weekly_hours CHECK (weekly_hours IS NULL OR weekly_hours > 0)
) 
ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci 
COMMENT='Eventos de programación académica con horarios, docentes y aulas';
