-- Migración: Crear tabla academic_structures
-- Descripción: Almacena asignaturas, planes de estudio y estructura académica
-- Fecha: 2025-06-16

CREATE TABLE IF NOT EXISTS academic_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código único de la asignatura/plan',
    name VARCHAR(255) NOT NULL COMMENT 'Nombre de la asignatura o plan',
    credits INT NULL COMMENT 'Número de créditos de la asignatura',
    plan_id INT NULL COMMENT 'ID del plan de estudios al que pertenece',
    type ENUM('subject', 'plan', 'module') NOT NULL DEFAULT 'subject' COMMENT 'Tipo: asignatura, plan o módulo',
    semester INT NULL COMMENT 'Semestre recomendado (1-10)',
    prerequisites TEXT NULL COMMENT 'Códigos de asignaturas prerrequisito separados por coma',
    description TEXT NULL COMMENT 'Descripción detallada',
    hours_per_week INT NULL COMMENT 'Horas académicas por semana',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si está activo en el sistema',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Índices para optimizar consultas
    INDEX idx_code (code),
    INDEX idx_plan_id (plan_id),
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_semester (semester),
    
    -- Restricciones
    CONSTRAINT chk_credits CHECK (credits >= 0 AND credits <= 20),
    CONSTRAINT chk_semester CHECK (semester >= 1 AND semester <= 10),
    CONSTRAINT chk_hours CHECK (hours_per_week >= 0 AND hours_per_week <= 50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Estructura académica: asignaturas, planes de estudio y módulos';

-- Crear relación de autoreferencia para plan_id (FK opcional)
ALTER TABLE academic_structures 
ADD CONSTRAINT fk_academic_structures_plan 
FOREIGN KEY (plan_id) REFERENCES academic_structures(id) 
ON DELETE SET NULL ON UPDATE CASCADE;
