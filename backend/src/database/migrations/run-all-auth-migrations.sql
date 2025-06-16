-- Script maestro para ejecutar todas las migraciones de autenticación
-- Fecha: 2025-06-15
-- Descripción: Crea el esquema completo de autenticación

USE planificacion_academica;

-- 001: Crear tabla Roles
SOURCE 001-create-roles-table.sql;

-- 002: Crear tabla Users  
SOURCE 002-create-users-table.sql;

-- 003: Crear tabla Permissions
SOURCE 003-create-permissions-table.sql;

-- 004: Crear tabla RolePermissions
SOURCE 004-create-role-permissions-table.sql;

-- 005: Poblar con datos iniciales
SOURCE 005-seed-auth-data.sql;

-- Verificación
SELECT 'Verificando creación de tablas...' as mensaje;
SHOW TABLES LIKE '%role%';
SHOW TABLES LIKE '%user%';
SHOW TABLES LIKE '%permission%';

SELECT 'Verificando datos iniciales...' as mensaje;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_permissions FROM permissions;
SELECT COUNT(*) as total_role_permissions FROM role_permissions;
SELECT COUNT(*) as total_users FROM users;
