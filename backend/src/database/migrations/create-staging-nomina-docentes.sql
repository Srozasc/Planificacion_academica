-- Script para crear la tabla temporal staging_nomina_docentes

CREATE TABLE staging_nomina_docentes (
    docente NVARCHAR(255) NULL,
    id_docente NVARCHAR(50) NULL,
    rut_docente NVARCHAR(20) NULL,
    id_bimestre INT NULL
);

PRINT 'Tabla staging_nomina_docentes creada exitosamente';