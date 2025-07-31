-- Migration: 018-create-vacantes-inicio-permanente-table.sql
-- Descripción: Crear tabla permanente para almacenar vacantes de inicio aprobadas
-- Fecha: 2024

-- Verificar si la tabla ya existe
SET @table_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'planificacion_academica'
    AND TABLE_NAME = 'vacantes_inicio_permanente'
);

-- Crear la tabla solo si no existe
SET @sql = IF(@table_exists = 0,
    'CREATE TABLE vacantes_inicio_permanente (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo_plan VARCHAR(50) NOT NULL,
        carrera VARCHAR(255) NOT NULL,
        sigla_asignatura VARCHAR(20) NOT NULL,
        asignatura VARCHAR(255) NOT NULL,
        nivel VARCHAR(50) NOT NULL,
        creditos INT NOT NULL,
        vacantes INT NOT NULL,
        id_bimestre INT NOT NULL,
        fecha_aprobacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        aprobado_por VARCHAR(255) NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        
        -- Índices para optimizar consultas
        INDEX IX_vacantes_inicio_permanente_bimestre (id_bimestre),
        INDEX IX_vacantes_inicio_permanente_sigla (sigla_asignatura),
        INDEX IX_vacantes_inicio_permanente_codigo_plan (codigo_plan),
        INDEX IX_vacantes_inicio_permanente_fecha_aprobacion (fecha_aprobacion),
        
        -- Índice compuesto para evitar duplicados por bimestre
        UNIQUE INDEX UX_vacantes_inicio_permanente_unique (
            codigo_plan, sigla_asignatura, id_bimestre
        )
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    'SELECT "La tabla vacantes_inicio_permanente ya existe" as mensaje;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración 018: Tabla vacantes_inicio_permanente creada exitosamente' as resultado;