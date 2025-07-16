-- =============================================
-- Script: 015-remove-documento-identificacion-column.sql
-- Propósito: Eliminar la columna documento_identificacion de la tabla users
-- Fecha: 2025-01-27
-- Razón: Campo no utilizado en la lógica de negocio y causando problemas de longitud de datos
-- =============================================

USE planificacion_academica;

-- Verificar que la columna existe antes de eliminarla
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'planificacion_academica' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'documento_identificacion';

-- Eliminar la columna documento_identificacion
ALTER TABLE users 
DROP COLUMN documento_identificacion;

-- Verificar que la columna se eliminó correctamente
DESCRIBE users;

SELECT 'Migración 015: Columna documento_identificacion eliminada exitosamente' AS resultado;