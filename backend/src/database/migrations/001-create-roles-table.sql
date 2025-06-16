-- Migración 001: Crear tabla Roles
-- Descripción: Tabla para almacenar los roles del sistema (Administrador, Director/Jefe de Programa, Usuario Lector)

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Comentarios de la tabla
ALTER TABLE roles COMMENT = 'Tabla de roles del sistema para control de acceso';
