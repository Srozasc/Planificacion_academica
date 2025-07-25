-- Migration: 016-add-fechas-pago-to-bimestres.sql
-- Description: Agregar campos fechaPago1 y fechaPago2 a la tabla bimestres
-- Date: 2025-01-27

-- Agregar las columnas fechaPago1 y fechaPago2 a la tabla bimestres
ALTER TABLE bimestres 
ADD COLUMN fechaPago1 DATE NULL,
ADD COLUMN fechaPago2 DATE NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'planificacion_academica'
AND TABLE_NAME = 'bimestres' 
AND COLUMN_NAME IN ('fechaPago1', 'fechaPago2');