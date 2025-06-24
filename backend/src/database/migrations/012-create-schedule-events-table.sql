-- =============================================
-- Script: 012-create-schedule-events-table.sql
-- Propósito: Crear tabla para eventos del calendario académico
-- Fecha: 2025-01-20
-- =============================================

USE planificacion_academica;

-- Crear tabla de eventos de programación académica
CREATE TABLE IF NOT EXISTS schedule_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Título del evento',
    description TEXT NULL COMMENT 'Descripción detallada del evento',
    start_date DATETIME NOT NULL COMMENT 'Fecha y hora de inicio del evento',
    end_date DATETIME NOT NULL COMMENT 'Fecha y hora de fin del evento',
    teacher VARCHAR(100) NULL COMMENT 'Profesor asignado al evento',
    subject VARCHAR(100) NULL COMMENT 'Materia o asignatura',
    room VARCHAR(50) NULL COMMENT 'Aula o salón asignado',
    students INT NULL COMMENT 'Número de estudiantes',
    background_color VARCHAR(7) NULL COMMENT 'Color de fondo para el calendario (formato hex)',
    bimestre_id INT NULL COMMENT 'ID del bimestre asociado',
    active BOOLEAN DEFAULT TRUE COMMENT 'Estado activo del evento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    
    -- Índices para mejorar el rendimiento
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_bimestre_id (bimestre_id),
    INDEX idx_room (room),
    INDEX idx_active (active),
    INDEX idx_date_range (start_date, end_date),
    
    -- Constraint para validar que la fecha de fin sea posterior al inicio
    CONSTRAINT chk_end_after_start CHECK (end_date > start_date),
    
    -- Constraint para validar formato de color hex
    CONSTRAINT chk_color_format CHECK (background_color IS NULL OR background_color REGEXP '^#[0-9A-Fa-f]{6}$'),
    
    -- Constraint para validar número de estudiantes
    CONSTRAINT chk_students_positive CHECK (students IS NULL OR students > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla para almacenar eventos del calendario académico';

-- Agregar foreign key después de crear la tabla
ALTER TABLE schedule_events 
ADD CONSTRAINT fk_events_bimestre 
    FOREIGN KEY (bimestre_id) 
    REFERENCES bimestres(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Crear vista para eventos activos con información del bimestre
CREATE OR REPLACE VIEW v_schedule_events_active AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.teacher,
    e.subject,
    e.room,
    e.students,
    e.background_color,
    e.bimestre_id,
    e.created_at,
    e.updated_at,
    b.nombre AS bimestre_nombre,
    b.anoAcademico AS bimestre_ano_academico,
    b.fechaInicio AS bimestre_fecha_inicio,
    b.fechaFin AS bimestre_fecha_fin,
    TIMESTAMPDIFF(MINUTE, e.start_date, e.end_date) AS duration_minutes,
    DATE(e.start_date) AS event_date
FROM schedule_events e
LEFT JOIN bimestres b ON e.bimestre_id = b.id
WHERE e.active = TRUE
ORDER BY e.start_date;

-- Procedimiento almacenado para obtener eventos en un rango de fechas
DELIMITER //
CREATE OR REPLACE PROCEDURE sp_GetEventsByDateRange(
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_bimestre_id INT DEFAULT NULL,
    IN p_active BOOLEAN DEFAULT TRUE
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT 
        e.id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.teacher,
        e.subject,
        e.room,
        e.students,
        e.background_color,
        e.bimestre_id,
        e.active,
        e.created_at,
        e.updated_at,
        b.nombre AS bimestre_nombre,
        b.anoAcademico AS bimestre_ano_academico
    FROM schedule_events e
    LEFT JOIN bimestres b ON e.bimestre_id = b.id
    WHERE 
        (p_active IS NULL OR e.active = p_active)
        AND (p_bimestre_id IS NULL OR e.bimestre_id = p_bimestre_id)
        AND (
            (e.start_date BETWEEN p_start_date AND p_end_date)
            OR (e.end_date BETWEEN p_start_date AND p_end_date)
            OR (e.start_date <= p_start_date AND e.end_date >= p_end_date)
        )
    ORDER BY e.start_date;
END //
DELIMITER ;

-- Función para verificar conflictos de horario en una sala
DELIMITER //
CREATE OR REPLACE FUNCTION fn_CheckRoomConflict(
    p_room VARCHAR(50),
    p_start_date DATETIME,
    p_end_date DATETIME,
    p_exclude_event_id INT DEFAULT NULL
) RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    SELECT COUNT(*)
    INTO conflict_count
    FROM schedule_events
    WHERE 
        room = p_room
        AND active = TRUE
        AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id)
        AND (
            (start_date < p_end_date AND end_date > p_start_date)
        );
    
    RETURN conflict_count;
END //
DELIMITER ;

-- Trigger para validar conflictos antes de insertar
DELIMITER //
CREATE OR REPLACE TRIGGER tr_schedule_events_before_insert
BEFORE INSERT ON schedule_events
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    -- Validar que la fecha de fin sea posterior al inicio
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de fin debe ser posterior a la fecha de inicio';
    END IF;
    
    -- Verificar conflictos de sala solo si se especifica una sala
    IF NEW.room IS NOT NULL AND NEW.room != '' THEN
        SET conflict_count = fn_CheckRoomConflict(NEW.room, NEW.start_date, NEW.end_date, NULL);
        
        IF conflict_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflicto de horario: La sala ya está ocupada en ese horario';
        END IF;
    END IF;
    
    -- Establecer valores por defecto
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = NOW();
    END IF;
    
    IF NEW.updated_at IS NULL THEN
        SET NEW.updated_at = NOW();
    END IF;
END //
DELIMITER ;

-- Trigger para validar conflictos antes de actualizar
DELIMITER //
CREATE OR REPLACE TRIGGER tr_schedule_events_before_update
BEFORE UPDATE ON schedule_events
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    -- Validar que la fecha de fin sea posterior al inicio
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de fin debe ser posterior a la fecha de inicio';
    END IF;
    
    -- Verificar conflictos de sala solo si se especifica una sala y hay cambios relevantes
    IF NEW.room IS NOT NULL AND NEW.room != '' AND (
        NEW.room != OLD.room OR 
        NEW.start_date != OLD.start_date OR 
        NEW.end_date != OLD.end_date
    ) THEN
        SET conflict_count = fn_CheckRoomConflict(NEW.room, NEW.start_date, NEW.end_date, NEW.id);
        
        IF conflict_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflicto de horario: La sala ya está ocupada en ese horario';
        END IF;
    END IF;
    
    -- Actualizar timestamp
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- Insertar algunos eventos de ejemplo para testing
INSERT INTO schedule_events (
    title, description, start_date, end_date, teacher, subject, room, students, background_color, active
) VALUES 
(
    'Matemáticas - Álgebra Lineal',
    'Clase de álgebra lineal para estudiantes de ingeniería',
    '2025-01-21 08:00:00',
    '2025-01-21 09:30:00',
    'Dr. Juan Pérez',
    'Matemáticas',
    'Aula 101',
    25,
    '#3B82F6',
    TRUE
),
(
    'Física - Mecánica Cuántica',
    'Introducción a los principios de mecánica cuántica',
    '2025-01-21 10:00:00',
    '2025-01-21 11:30:00',
    'Dra. María García',
    'Física',
    'Lab. Física',
    20,
    '#10B981',
    TRUE
),
(
    'Programación - Estructuras de Datos',
    'Implementación de estructuras de datos en Python',
    '2025-01-22 14:00:00',
    '2025-01-22 16:00:00',
    'Ing. Carlos Rodríguez',
    'Programación',
    'Lab. Computación',
    30,
    '#F59E0B',
    TRUE
);

-- Mostrar estadísticas después de la creación
SELECT 
    'schedule_events' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN active = TRUE THEN 1 END) as eventos_activos,
    COUNT(CASE WHEN room IS NOT NULL THEN 1 END) as eventos_con_sala
FROM schedule_events;
