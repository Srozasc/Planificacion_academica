-- Migración 002: Crear tabla Users
-- Descripción: Tabla para almacenar la información de los usuarios

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_institucional VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_email (email_institucional),
    INDEX idx_role (role_id),
    INDEX idx_active (is_active)
);

-- Comentarios de la tabla
ALTER TABLE users COMMENT = 'Tabla de usuarios del sistema';
