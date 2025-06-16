-- Migración 003: Crear tabla Permissions
-- Descripción: Tabla para definir permisos granulares en el sistema

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_name (name)
);

-- Comentarios de la tabla
ALTER TABLE permissions COMMENT = 'Tabla de permisos del sistema para control granular de acceso';
