-- =============================================
-- Script: 012-create-schedule-events-table-simple.sql
-- Propósito: Crear tabla para eventos del calendario académico (versión simplificada)
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
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla para almacenar eventos del calendario académico';

-- Agregar foreign key después de crear la tabla
ALTER TABLE schedule_events 
ADD CONSTRAINT fk_events_bimestre 
    FOREIGN KEY (bimestre_id) 
    REFERENCES bimestres(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

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

-- Verificar inserción
SELECT 
    'schedule_events' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN active = TRUE THEN 1 END) as eventos_activos,
    COUNT(CASE WHEN room IS NOT NULL THEN 1 END) as eventos_con_sala
FROM schedule_events;
