-- Migración: 014a-create-configuration-table.sql
-- Descripción: Crear tabla de configuraciones globales (solo estructura)
-- Fecha: 2025-06-17

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
