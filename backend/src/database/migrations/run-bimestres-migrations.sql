-- =============================================
-- Script: run-bimestres-migrations.sql
-- Propósito: Ejecutar todas las migraciones relacionadas con bimestres
-- Fecha: 2025-01-30
-- =============================================

-- Ejecutar migración de rangos de fechas de pago para bimestres
SOURCE 017-update-bimestres-fecha-pago-ranges.sql;

-- Verificar que la tabla se actualizó correctamente
DESCRIBE bimestres;

-- Verificar que las nuevas columnas existen
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'planificacion_academica'
AND TABLE_NAME = 'bimestres' 
AND COLUMN_NAME IN ('fechaPago1Inicio', 'fechaPago1Fin', 'fechaPago2Inicio', 'fechaPago2Fin')
ORDER BY COLUMN_NAME;

-- Mostrar estructura completa de la tabla bimestres
SHOW CREATE TABLE bimestres;

-- Verificar datos existentes (si los hay)
SELECT id, nombre, fechaInicio, fechaFin, fechaPago1Inicio, fechaPago1Fin, fechaPago2Inicio, fechaPago2Fin 
FROM bimestres 
ORDER BY id;

SELECT 'Migración de bimestres completada exitosamente' AS status;