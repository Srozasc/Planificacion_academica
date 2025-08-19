-- =============================================
-- Migración: Crear tabla permanente para asignaturas optativas aprobadas
-- Archivo: 022-create-asignaturas-optativas-permanente.sql
-- Fecha: 2025-01-30
-- Descripción: Crear tabla permanente para almacenar asignaturas optativas aprobadas
-- =============================================

USE planificacion_academica;

-- Verificar si la tabla ya existe
SET @table_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'planificacion_academica'
    AND TABLE_NAME = 'asignaturas_optativas_aprobadas'
);

-- Crear la tabla solo si no existe
SET @sql = IF(@table_exists = 0,
    'CREATE TABLE asignaturas_optativas_aprobadas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Campos principales del archivo Excel
        plan VARCHAR(20) NOT NULL COMMENT "Código del plan de estudios",
        descripcion_plan VARCHAR(255) NOT NULL COMMENT "Descripción del plan de estudios",
        nivel VARCHAR(10) NOT NULL COMMENT "Nivel académico",
        grupo_asignatura VARCHAR(50) NOT NULL COMMENT "Grupo de asignatura",
        jornada VARCHAR(50) NOT NULL COMMENT "Jornada (A DISTANCIA, DIURNA, etc.)",
        asignatura VARCHAR(20) NOT NULL COMMENT "Código de la asignatura",
        descripcion_asignatura VARCHAR(255) NOT NULL COMMENT "Descripción de la asignatura",
        vacantes INT NOT NULL COMMENT "Número de vacantes disponibles",
        horas INT NOT NULL DEFAULT 0 COMMENT "Número de horas de la asignatura",
        
        -- Campo de control de bimestre
        id_bimestre INT NOT NULL COMMENT "ID del bimestre al que pertenece",
        
        -- Campos de auditoría
        fecha_aprobacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "Fecha de aprobación",
        aprobado_por VARCHAR(255) NULL COMMENT "Email del usuario que aprobó",
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT "Fecha de creación del registro",
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "Fecha de última actualización",
        activo BOOLEAN DEFAULT TRUE COMMENT "Indica si el registro está activo",
        
        -- Índices para optimizar consultas
        INDEX IX_asignaturas_optativas_aprobadas_bimestre (id_bimestre),
        INDEX IX_asignaturas_optativas_aprobadas_plan (plan),
        INDEX IX_asignaturas_optativas_aprobadas_asignatura (asignatura),
        INDEX IX_asignaturas_optativas_aprobadas_nivel (nivel),
        INDEX IX_asignaturas_optativas_aprobadas_jornada (jornada),
        INDEX IX_asignaturas_optativas_aprobadas_fecha_aprobacion (fecha_aprobacion),
        INDEX IX_asignaturas_optativas_aprobadas_aprobado_por (aprobado_por),
        
        -- Índices compuestos para consultas frecuentes
        INDEX IX_asignaturas_optativas_plan_bimestre (plan, id_bimestre),
        INDEX IX_asignaturas_optativas_asignatura_bimestre (asignatura, id_bimestre),
        INDEX IX_asignaturas_optativas_nivel_jornada (nivel, jornada),
        
        -- Clave única para evitar duplicados
        UNIQUE KEY UK_asignaturas_optativas_unique (plan, asignatura, id_bimestre),
        
        -- Restricciones de clave foránea
        CONSTRAINT FK_asignaturas_optativas_bimestre 
            FOREIGN KEY (id_bimestre) REFERENCES bimestres(id) 
            ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT="Tabla permanente para almacenar asignaturas optativas aprobadas"',
    'SELECT "Tabla asignaturas_optativas_aprobadas ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración 022: Tabla asignaturas_optativas_aprobadas procesada exitosamente' AS resultado;

/*
ESTRUCTURA DE LA TABLA:
- plan: Código del plan (ej: 1116221)
- descripcion_plan: Nombre del plan (ej: INGENIERIA EN MARKETING DIGITAL)
- nivel: Nivel académico (ej: 8)
- grupo_asignatura: Grupo de asignatura (ej: OCG1116221)
- jornada: Modalidad (ej: A DISTANCIA)
- asignatura: Código de asignatura (ej: CCG0027)
- descripcion_asignatura: Nombre de asignatura (ej: EL LIDERAZGO EN EL TRABAJO EN EQUIPO)
- vacantes: Número de vacantes (ej: 40)
- horas: Número de horas de la asignatura (ej: 4)
- id_bimestre: ID del bimestre para control

CAMPOS DE AUDITORÍA:
- fecha_aprobacion: Cuándo se aprobó
- aprobado_por: Quién aprobó (email)
- fecha_creacion, fecha_actualizacion: Timestamps automáticos
- activo: Control de estado

ÍNDICES OPTIMIZADOS:
- Por bimestre (consultas más frecuentes)
- Por plan y asignatura (búsquedas específicas)
- Por nivel y jornada (filtros académicos)
- Por fecha de aprobación (reportes temporales)
- Por usuario aprobador (auditoría)
- Índices compuestos para consultas complejas
- Clave única para evitar duplicados
*/