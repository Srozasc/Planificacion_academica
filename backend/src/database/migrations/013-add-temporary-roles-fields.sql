-- =============================================
-- Script: 013-add-temporary-roles-fields.sql
-- Propósito: Agregar campos para roles temporales en la tabla users
-- Fecha: 2025-01-27
-- =============================================

USE planificacion_academica;

-- Agregar columna para fecha de expiración del rol
ALTER TABLE users 
ADD COLUMN role_expires_at DATETIME NULL COMMENT 'Fecha y hora de expiración del rol temporal';

-- Agregar columna para el rol anterior
ALTER TABLE users 
ADD COLUMN previous_role_id INT NULL COMMENT 'ID del rol anterior antes de asignar rol temporal';

-- Agregar foreign key constraint para previous_role_id
ALTER TABLE users 
ADD CONSTRAINT fk_users_previous_role 
FOREIGN KEY (previous_role_id) REFERENCES roles(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Agregar índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_users_role_expires_at ON users(role_expires_at);
CREATE INDEX idx_users_previous_role_id ON users(previous_role_id);

-- Comentarios para documentar los cambios
ALTER TABLE users COMMENT = 'Tabla de usuarios con soporte para roles temporales';

-- Verificar que las columnas se agregaron correctamente
DESCRIBE users;

SELECT 'Migración 013: Campos de roles temporales agregados exitosamente' AS resultado;