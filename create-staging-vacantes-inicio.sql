-- Script para crear la tabla temporal staging_vacantes_inicio

CREATE TABLE staging_vacantes_inicio (
    codigo_plan NVARCHAR(50) NULL,
    carrera NVARCHAR(255) NULL,
    sigla_asignatura NVARCHAR(50) NULL,
    asignatura NVARCHAR(255) NULL,
    nivel NVARCHAR(50) NULL,
    creditos INT NULL,
    vacantes INT NULL,
    id_bimestre INT NULL
);

PRINT 'Tabla staging_vacantes_inicio creada exitosamente';