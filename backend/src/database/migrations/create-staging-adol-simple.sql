-- Tabla de paso simplificada para archivo ADOL
-- Solo contiene los campos esenciales: SIGLA, DESCRIPCIÓN e id_bimestre
-- Compatible con MySQL

USE planificacion_academica;

-- Eliminar tabla si existe
DROP TABLE IF EXISTS staging_adol_simple;

-- Crear tabla de paso para ADOL (simplificada)
CREATE TABLE staging_adol_simple (
    SIGLA VARCHAR(20) NOT NULL,
    DESCRIPCION VARCHAR(500) NOT NULL,
    id_bimestre INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear índice para optimizar consultas por bimestre
CREATE INDEX IX_staging_adol_simple_bimestre 
ON staging_adol_simple (id_bimestre);

-- Crear índice para optimizar búsquedas por SIGLA
CREATE INDEX IX_staging_adol_simple_sigla 
ON staging_adol_simple (SIGLA);

SELECT 'Tabla staging_adol_simple creada exitosamente' AS mensaje;
SELECT 'Campos: SIGLA, DESCRIPCION, id_bimestre' AS estructura;
SELECT 'Índices creados para optimización' AS indices;