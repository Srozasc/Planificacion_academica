-- Migration: 017-update-bimestres-fecha-pago-ranges.sql
-- Description: Actualizar tabla bimestres para usar rangos de fechas de pago
-- Date: 2025-01-30
-- Replaces: 016-add-fechas-pago-to-bimestres.sql

-- Eliminar las columnas anteriores de fechas de pago individuales si existen
ALTER TABLE bimestres 
DROP COLUMN IF EXISTS fechaPago1,
DROP COLUMN IF EXISTS fechaPago2;

-- Agregar las nuevas columnas para rangos de fechas de pago
ALTER TABLE bimestres 
ADD COLUMN fechaPago1Inicio DATE NULL,
ADD COLUMN fechaPago1Fin DATE NULL,
ADD COLUMN fechaPago2Inicio DATE NULL,
ADD COLUMN fechaPago2Fin DATE NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'planificacion_academica'
AND TABLE_NAME = 'bimestres' 
AND COLUMN_NAME IN ('fechaPago1Inicio', 'fechaPago1Fin', 'fechaPago2Inicio', 'fechaPago2Fin')
ORDER BY COLUMN_NAME;

-- Mostrar la estructura final de la tabla
DESCRIBE bimestres;