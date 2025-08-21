-- Script para crear la tabla temporal staging_dol
-- Archivo: create-staging-dol-simple.sql
-- Descripción: Tabla temporal para procesar archivos DOL (Distribución de Ofertas de Línea)
-- Solo para carga temporal, sin procedimientos almacenados

USE [planificacion_academica];
GO

-- Eliminar tabla si existe
IF OBJECT_ID('staging_dol', 'U') IS NOT NULL
    DROP TABLE staging_dol;
GO

-- Crear tabla staging_dol
CREATE TABLE staging_dol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan VARCHAR(50) NOT NULL,
    sigla VARCHAR(20) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    id_bimestre INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear índice para mejorar rendimiento
CREATE INDEX IX_staging_dol_sigla ON staging_dol (sigla);

-- Agregar restricción de clave foránea para id_bimestre
ALTER TABLE staging_dol
ADD CONSTRAINT FK_staging_dol_bimestre
FOREIGN KEY (id_bimestre) REFERENCES bimestres(id);

SELECT 'Tabla staging_dol creada exitosamente con índices' AS mensaje;