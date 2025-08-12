-- Migración 020: Agregar campo 'factor' a la tabla bimestres
-- Fecha: 2024
-- Descripción: Añade el campo 'factor' de tipo DECIMAL a la tabla bimestres

USE planificacion_academica;

-- Verificar la estructura actual de la tabla bimestres
SELECT 'Estructura actual de bimestres:' as info;
DESCRIBE bimestres;

-- Agregar el campo 'factor' a la tabla bimestres
ALTER TABLE bimestres 
ADD COLUMN factor DECIMAL(10,6) NULL COMMENT 'Factor multiplicador para cálculos del bimestre';

-- Verificar que el campo se agregó correctamente
SELECT 'Estructura actualizada de bimestres:' as info;
DESCRIBE bimestres;

-- Verificar registros existentes (el campo factor será NULL inicialmente)
SELECT 
    id,
    nombre,
    anoAcademico,
    numeroBimestre,
    factor,
    activo
FROM bimestres 
ORDER BY anoAcademico DESC, numeroBimestre DESC
LIMIT 10;

SELECT 'Migración 020 completada exitosamente' as resultado;