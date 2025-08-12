-- =============================================
-- Migración: Crear tabla staging_optativos
-- Archivo: 020-create-staging-optativos.sql
-- Fecha: 2025-01-30
-- Descripción: Crear tabla de paso para carga de asignaturas optativas
-- =============================================

USE planificacion_academica;

-- Eliminar tabla si existe
DROP TABLE IF EXISTS staging_optativos;

-- Crear tabla staging_optativos
CREATE TABLE staging_optativos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Campos del archivo Excel
    plan VARCHAR(20) NOT NULL COMMENT 'Código del plan de estudios',
    descripcion_plan VARCHAR(255) NOT NULL COMMENT 'Descripción del plan de estudios',
    nivel VARCHAR(10) NOT NULL COMMENT 'Nivel académico',
    grupo_asignatura VARCHAR(50) NOT NULL COMMENT 'Grupo de asignatura',
    jornada VARCHAR(50) NOT NULL COMMENT 'Jornada (A DISTANCIA, DIURNA, etc.)',
    asignatura VARCHAR(20) NOT NULL COMMENT 'Código de la asignatura',
    descripcion_asignatura VARCHAR(255) NOT NULL COMMENT 'Descripción de la asignatura',
    vacantes INT NOT NULL COMMENT 'Número de vacantes disponibles',
    
    -- Campo de control de bimestre
    id_bimestre INT NOT NULL COMMENT 'ID del bimestre al que pertenece',
    
    -- Campos de auditoría y control
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('pending', 'processed', 'error') DEFAULT 'pending' COMMENT 'Estado del procesamiento',
    error_message TEXT NULL COMMENT 'Mensaje de error si el procesamiento falla',
    processed_at TIMESTAMP NULL COMMENT 'Fecha y hora de procesamiento',
    processed_by VARCHAR(100) NULL COMMENT 'Usuario que procesó el registro'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear índices para optimización
CREATE INDEX IX_staging_optativos_bimestre ON staging_optativos (id_bimestre);
CREATE INDEX IX_staging_optativos_plan ON staging_optativos (plan);
CREATE INDEX IX_staging_optativos_asignatura ON staging_optativos (asignatura);
CREATE INDEX IX_staging_optativos_status ON staging_optativos (status);
CREATE INDEX IX_staging_optativos_nivel ON staging_optativos (nivel);

-- Crear índice compuesto para consultas frecuentes
CREATE INDEX IX_staging_optativos_plan_nivel ON staging_optativos (plan, nivel);
CREATE INDEX IX_staging_optativos_bimestre_status ON staging_optativos (id_bimestre, status);

-- Agregar restricción de clave foránea para id_bimestre
ALTER TABLE staging_optativos
ADD CONSTRAINT FK_staging_optativos_bimestre
FOREIGN KEY (id_bimestre) REFERENCES bimestres(id)
ON DELETE CASCADE;

-- Agregar constraint para status válidos
ALTER TABLE staging_optativos 
ADD CONSTRAINT CK_staging_optativos_status 
CHECK (status IN ('pending', 'processed', 'error'));

-- Mensaje de confirmación
SELECT 'Tabla staging_optativos creada exitosamente' AS mensaje;
SELECT 'Índices y constraints aplicados correctamente' AS indices;

/*
ESTRUCTURA DE LA TABLA:
- plan: Código del plan (ej: 1116221)
- descripcion_plan: Nombre del plan (ej: INGENIERIA EN MARKETING DIGITAL)
- nivel: Nivel académico (ej: 8)
- grupo_asignatura: Grupo de asignatura (ej: OCG1116221)
- jornada: Modalidad (ej: A DISTANCIA)
- asignatura: Código de asignatura (ej: CCG0027)
- descripcion_asignatura: Nombre de asignatura (ej: EL LIDERAZGO EN EL TRABAJO EN EQUIPO)
- vacantes: Número de vacantes (ej: 40)
- id_bimestre: ID del bimestre para control

CAMPOS DE CONTROL:
- created_at, updated_at: Timestamps automáticos
- status: Estado del procesamiento (pending/processed/error)
- error_message: Detalles de errores
- processed_at, processed_by: Auditoría de procesamiento
*/