-- Migración: 010-create-course-reports-data-table.sql
-- Descripción: Tabla de datos de reportes de cursables por asignatura
-- Fecha: 2025-06-16

CREATE TABLE IF NOT EXISTS course_reports_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relación con estructura académica
    academic_structure_id INT NOT NULL COMMENT 'ID de la estructura académica (asignatura)',
    
    -- Datos del reporte
    student_count INT NOT NULL DEFAULT 0 COMMENT 'Cantidad de estudiantes cursables',
    term ENUM('1', '2', 'anual', 'intensivo') NOT NULL COMMENT 'Semestre o período académico',
    year YEAR NOT NULL COMMENT 'Año académico',
    
    -- Información adicional opcional
    section VARCHAR(10) NULL COMMENT 'Sección de la asignatura (A, B, C, etc.)',
    modality ENUM('presencial', 'online', 'mixta') NOT NULL DEFAULT 'presencial' COMMENT 'Modalidad de la asignatura',
    
    -- Datos estadísticos adicionales
    enrolled_count INT NULL COMMENT 'Estudiantes matriculados inicialmente',
    passed_count INT NULL COMMENT 'Estudiantes que aprobaron',
    failed_count INT NULL COMMENT 'Estudiantes que reprobaron',
    withdrawn_count INT NULL COMMENT 'Estudiantes que se retiraron',
    
    -- Información de horarios
    weekly_hours DECIMAL(4,2) NULL COMMENT 'Horas semanales de la asignatura',
    total_hours DECIMAL(6,2) NULL COMMENT 'Total de horas del período',
    
    -- Estado del reporte
    is_validated BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si los datos han sido validados',
    validated_by INT NULL COMMENT 'ID del usuario que validó',
    validated_at TIMESTAMP NULL COMMENT 'Fecha de validación',
    
    -- Observaciones
    notes TEXT NULL COMMENT 'Observaciones adicionales del reporte',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Clave foránea
    FOREIGN KEY (academic_structure_id) REFERENCES academic_structures(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices para optimización
    INDEX idx_course_reports_academic_structure (academic_structure_id),
    INDEX idx_course_reports_term_year (term, year),
    INDEX idx_course_reports_year (year),
    INDEX idx_course_reports_modality (modality),
    INDEX idx_course_reports_validation (is_validated, validated_at),
    INDEX idx_course_reports_deleted (deleted_at),
    
    -- Índice compuesto para consultas frecuentes
    INDEX idx_course_reports_structure_period (academic_structure_id, year, term),
    
    -- Constraint único para evitar duplicados
    UNIQUE KEY uk_course_reports_unique (academic_structure_id, year, term, section),
    
    -- Constraints de validación
    CONSTRAINT chk_student_count_positive CHECK (student_count >= 0),
    CONSTRAINT chk_enrolled_count_positive CHECK (enrolled_count IS NULL OR enrolled_count >= 0),
    CONSTRAINT chk_passed_count_positive CHECK (passed_count IS NULL OR passed_count >= 0),
    CONSTRAINT chk_failed_count_positive CHECK (failed_count IS NULL OR failed_count >= 0),
    CONSTRAINT chk_withdrawn_count_positive CHECK (withdrawn_count IS NULL OR withdrawn_count >= 0),
    CONSTRAINT chk_weekly_hours_positive CHECK (weekly_hours IS NULL OR weekly_hours > 0),
    CONSTRAINT chk_total_hours_positive CHECK (total_hours IS NULL OR total_hours > 0),
    CONSTRAINT chk_year_valid CHECK (year >= 2020 AND year <= 2050),
    CONSTRAINT chk_counts_consistency CHECK (
        enrolled_count IS NULL OR 
        (passed_count IS NULL AND failed_count IS NULL AND withdrawn_count IS NULL) OR
        (enrolled_count >= COALESCE(passed_count, 0) + COALESCE(failed_count, 0) + COALESCE(withdrawn_count, 0))
    )
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Datos de reportes de cursables por asignatura y período académico';

-- Insertar datos de ejemplo para testing
-- Primero verificamos qué estructuras académicas existen
INSERT INTO course_reports_data (
    academic_structure_id,
    student_count,
    term,
    year,
    section,
    modality,
    enrolled_count,
    passed_count,
    failed_count,
    withdrawn_count,
    weekly_hours,
    total_hours,
    is_validated,
    notes
)
SELECT 
    academic_structure_id,
    student_count,
    term,
    year,
    section,
    modality,
    enrolled_count,
    passed_count,
    failed_count,
    withdrawn_count,
    weekly_hours,
    total_hours,
    is_validated,
    notes
FROM (
    SELECT 1 as academic_structure_id, 45 as student_count, '1' as term, 2025 as year, 'A' as section, 'presencial' as modality, 50 as enrolled_count, 35 as passed_count, 10 as failed_count, 5 as withdrawn_count, 6.0 as weekly_hours, 108.0 as total_hours, TRUE as is_validated, 'Curso con alto rendimiento académico' as notes
    UNION ALL
    SELECT 1, 38, '1', 2025, 'B', 'presencial', 42, 28, 8, 6, 6.0, 108.0, TRUE, 'Sección vespertina'
    UNION ALL
    SELECT 2, 32, '1', 2025, 'A', 'mixta', 35, 25, 5, 5, 8.0, 144.0, TRUE, 'Modalidad mixta por laboratorios'
    UNION ALL
    SELECT 3, 28, '2', 2024, 'A', 'presencial', 30, 22, 4, 4, 5.0, 90.0, TRUE, 'Curso completado el semestre anterior'
    UNION ALL
    SELECT 1, 25, 'intensivo', 2025, 'A', 'online', 25, 20, 3, 2, 4.0, 60.0, FALSE, 'Curso intensivo de verano'
    UNION ALL
    SELECT 2, 35, '2', 2025, 'A', 'presencial', NULL, NULL, NULL, NULL, 6.0, 108.0, FALSE, 'Proyección para segundo semestre'
    UNION ALL
    SELECT 1, 42, '1', 2025, 'C', 'mixta', 45, 38, 4, 3, 8.0, 144.0, TRUE, 'Curso con alta demanda'
    UNION ALL
    SELECT 2, 30, '2', 2024, 'A', 'presencial', 32, 26, 3, 3, 6.0, 108.0, TRUE, 'Excelente rendimiento'
    UNION ALL
    SELECT 3, 28, 'anual', 2025, 'A', 'presencial', 30, NULL, NULL, NULL, 4.0, 144.0, FALSE, 'Curso anual en desarrollo'
    UNION ALL
    SELECT 1, 20, '1', 2025, 'D', 'presencial', 22, 18, 2, 2, 10.0, 180.0, TRUE, 'Taller práctico con excelentes resultados'
) AS sample_data
WHERE academic_structure_id IN (SELECT id FROM academic_structures WHERE deleted_at IS NULL);
