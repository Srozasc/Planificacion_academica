-- Script para limpiar datos duplicados en la tabla roles
USE planificacion_academica;

-- Mostrar registros problemáticos
SELECT * FROM roles WHERE name = '' OR name IS NULL;

-- Eliminar registros con nombres vacíos o nulos
DELETE FROM roles WHERE name = '' OR name IS NULL;

-- Mostrar los roles restantes
SELECT * FROM roles;
