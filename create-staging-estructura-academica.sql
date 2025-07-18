-- Script para crear la tabla temporal staging_estructura_academica

CREATE TABLE staging_estructura_academica (
    plan NVARCHAR(50) NULL,
    carrera NVARCHAR(255) NULL,
    nivel NVARCHAR(50) NULL,
    sigla NVARCHAR(50) NULL,
    asignatura NVARCHAR(255) NULL,
    creditos INT NULL,
    categoria NVARCHAR(100) NULL,
    horas INT NULL,
    duracion_carrera NVARCHAR(100) NULL,
    clplestud NVARCHAR(50) NULL,
    codigo_escuela NVARCHAR(50) NULL,
    escuela_programa NVARCHAR(255) NULL,
    id_bimestre INT NULL
);

PRINT 'Tabla staging_estructura_academica creada exitosamente';