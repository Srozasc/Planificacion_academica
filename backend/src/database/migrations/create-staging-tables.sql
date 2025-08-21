-- =====================================================
-- SCRIPT: CREACIÓN DE TABLAS DE PASO (STAGING TABLES)
-- Proyecto: Agendador Campus
-- Fecha: 17 de Julio, 2025
-- Propósito: Implementar arquitectura de tablas de paso
-- =====================================================

USE [planificacion_academica];
GO

-- =====================================================
-- 1. TABLA STAGING: ADOL (Códigos de Pago)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_adol')
BEGIN
    CREATE TABLE staging_adol (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        sigla NVARCHAR(50) NULL,
        descripcion NVARCHAR(255) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending', -- pending/processed/error
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_adol creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_adol ya existe.';
GO

-- =====================================================
-- 2. TABLA STAGING: CURSABLES (Asignaturas Implementables)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_cursables')
BEGIN
    CREATE TABLE staging_cursables (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        rut NVARCHAR(20) NULL,
        plan NVARCHAR(100) NULL,
        nivel NVARCHAR(50) NULL,
        sigla NVARCHAR(50) NULL,
        asignatura NVARCHAR(255) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_cursables creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_cursables ya existe.';
GO

-- =====================================================
-- 3. TABLA STAGING: DOCENTES
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_docentes')
BEGIN
    CREATE TABLE staging_docentes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        docente NVARCHAR(255) NULL,
        id_docente NVARCHAR(50) NULL,
        rut_docente NVARCHAR(20) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_docentes creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_docentes ya existe.';
GO

-- =====================================================
-- 4. TABLA STAGING: DOL (Distribución de Carga)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_dol')
BEGIN
    CREATE TABLE staging_dol (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        plan NVARCHAR(100) NULL,
        sigla NVARCHAR(50) NULL,
        descripci_n NVARCHAR(255) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_dol creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_dol ya existe.';
GO

-- =====================================================
-- 5. TABLA STAGING: ESTRUCTURA ACADÉMICA
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_estructura_academica')
BEGIN
    CREATE TABLE staging_estructura_academica (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        plan NVARCHAR(100) NULL,
        carrera NVARCHAR(255) NULL,
        nivel NVARCHAR(50) NULL,
        sigla NVARCHAR(50) NULL,
        asignatura NVARCHAR(255) NULL,
        creditos NVARCHAR(10) NULL, -- Como string inicialmente
        categoria NVARCHAR(100) NULL,
        horas NVARCHAR(10) NULL, -- Como string inicialmente
        duracion_carrera NVARCHAR(50) NULL,
        clplestud NVARCHAR(50) NULL,
        codigo_escuela NVARCHAR(50) NULL,
        escuela_programa NVARCHAR(255) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_estructura_academica creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_estructura_academica ya existe.';
GO

-- =====================================================
-- 6. TABLA STAGING: USUARIOS AGENDADOR
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_usuarios_agendador')
BEGIN
    CREATE TABLE staging_usuarios_agendador (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        usuario NVARCHAR(100) NULL,
        nombre NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        campus NVARCHAR(100) NULL,
        rol NVARCHAR(100) NULL,
        activo NVARCHAR(10) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_usuarios_agendador creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_usuarios_agendador ya existe.';
GO

-- =====================================================
-- 7. TABLA STAGING: VACANTES
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_vacantes')
BEGIN
    CREATE TABLE staging_vacantes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        plan NVARCHAR(100) NULL,
        carrera NVARCHAR(255) NULL,
        nivel NVARCHAR(50) NULL,
        sigla NVARCHAR(50) NULL,
        asignatura NVARCHAR(255) NULL,
        vacantes_disponibles NVARCHAR(10) NULL, -- Como string inicialmente
        modalidad NVARCHAR(50) NULL,
        
        -- Campos de control
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        error_message NVARCHAR(MAX) NULL,
        processed_at DATETIME2 NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    PRINT 'Tabla staging_vacantes creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_vacantes ya existe.';
GO

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices por bimestre_id (consultas frecuentes)
CREATE NONCLUSTERED INDEX IX_staging_adol_bimestre 
    ON staging_adol (bimestre_id, status);

CREATE NONCLUSTERED INDEX IX_staging_cursables_bimestre 
    ON staging_cursables (bimestre_id, status);

CREATE NONCLUSTERED INDEX IX_staging_docentes_bimestre 
    ON staging_docentes (bimestre_id, status);

CREATE NONCLUSTERED INDEX IX_staging_dol_bimestre 
    ON staging_dol (bimestre_id, status);

CREATE NONCLUSTERED INDEX IX_staging_estructura_bimestre 
    ON staging_estructura_academica (bimestre_id, status);

CREATE NONCLUSTERED INDEX IX_staging_usuarios_bimestre 
    ON staging_usuarios_agendador (bimestre_id, status);

CREATE NONCLUSTERED INDEX IX_staging_vacantes_bimestre 
    ON staging_vacantes (bimestre_id, status);

-- Índices por status (para procesamiento)
CREATE NONCLUSTERED INDEX IX_staging_adol_status 
    ON staging_adol (status, created_at);

CREATE NONCLUSTERED INDEX IX_staging_cursables_status 
    ON staging_cursables (status, created_at);

CREATE NONCLUSTERED INDEX IX_staging_docentes_status 
    ON staging_docentes (status, created_at);

CREATE NONCLUSTERED INDEX IX_staging_dol_status 
    ON staging_dol (status, created_at);

CREATE NONCLUSTERED INDEX IX_staging_estructura_status 
    ON staging_estructura_academica (status, created_at);

CREATE NONCLUSTERED INDEX IX_staging_usuarios_status 
    ON staging_usuarios_agendador (status, created_at);

CREATE NONCLUSTERED INDEX IX_staging_vacantes_status 
    ON staging_vacantes (status, created_at);

PRINT 'Índices creados exitosamente.';
GO

-- =====================================================
-- CONSTRAINTS Y VALIDACIONES
-- =====================================================

-- Constraint para status válidos
ALTER TABLE staging_adol 
    ADD CONSTRAINT CK_staging_adol_status 
    CHECK (status IN ('pending', 'processed', 'error'));

ALTER TABLE staging_cursables 
    ADD CONSTRAINT CK_staging_cursables_status 
    CHECK (status IN ('pending', 'processed', 'error'));

ALTER TABLE staging_docentes 
    ADD CONSTRAINT CK_staging_docentes_status 
    CHECK (status IN ('pending', 'processed', 'error'));

ALTER TABLE staging_dol 
    ADD CONSTRAINT CK_staging_dol_status 
    CHECK (status IN ('pending', 'processed', 'error'));

ALTER TABLE staging_estructura_academica 
    ADD CONSTRAINT CK_staging_estructura_status 
    CHECK (status IN ('pending', 'processed', 'error'));

ALTER TABLE staging_usuarios_agendador 
    ADD CONSTRAINT CK_staging_usuarios_status 
    CHECK (status IN ('pending', 'processed', 'error'));

ALTER TABLE staging_vacantes 
    ADD CONSTRAINT CK_staging_vacantes_status 
    CHECK (status IN ('pending', 'processed', 'error'));

PRINT 'Constraints creados exitosamente.';
GO

-- =====================================================
-- TABLA DE LOG PARA PROCESAMIENTO
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staging_processing_log')
BEGIN
    CREATE TABLE staging_processing_log (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bimestre_id INT NOT NULL,
        staging_table NVARCHAR(100) NOT NULL,
        operation NVARCHAR(50) NOT NULL, -- load/process/error
        records_affected INT DEFAULT 0,
        success_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        start_time DATETIME2 DEFAULT GETDATE(),
        end_time DATETIME2 NULL,
        duration_ms INT NULL,
        error_details NVARCHAR(MAX) NULL,
        processed_by NVARCHAR(100) NULL
    );
    
    CREATE NONCLUSTERED INDEX IX_staging_log_bimestre 
        ON staging_processing_log (bimestre_id, staging_table);
    
    CREATE NONCLUSTERED INDEX IX_staging_log_operation 
        ON staging_processing_log (operation, start_time);
    
    PRINT 'Tabla staging_processing_log creada exitosamente.';
END
ELSE
    PRINT 'Tabla staging_processing_log ya existe.';
GO

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS BÁSICOS
-- =====================================================

-- Procedimiento para limpiar staging por bimestre
CREATE OR ALTER PROCEDURE sp_CleanStagingByBimestre
    @BimestreId INT,
    @StagingTable NVARCHAR(100) = NULL -- Si es NULL, limpia todas
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @TablesDeleted INT = 0;
    
    -- Si no se especifica tabla, limpiar todas
    IF @StagingTable IS NULL
    BEGIN
        DELETE FROM staging_adol WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        DELETE FROM staging_cursables WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        DELETE FROM staging_docentes WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        DELETE FROM staging_dol WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        DELETE FROM staging_estructura_academica WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        DELETE FROM staging_usuarios_agendador WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        DELETE FROM staging_vacantes WHERE bimestre_id = @BimestreId;
        SET @TablesDeleted = @TablesDeleted + @@ROWCOUNT;
        
        PRINT 'Limpieza completa: ' + CAST(@TablesDeleted AS NVARCHAR(10)) + ' registros eliminados.';
    END
    ELSE
    BEGIN
        -- Limpiar tabla específica
        SET @SQL = 'DELETE FROM ' + @StagingTable + ' WHERE bimestre_id = ' + CAST(@BimestreId AS NVARCHAR(10));
        EXEC sp_executesql @SQL;
        
        PRINT 'Tabla ' + @StagingTable + ' limpiada para bimestre ' + CAST(@BimestreId AS NVARCHAR(10));
    END
END;
GO

-- Procedimiento para obtener estadísticas de staging
CREATE OR ALTER PROCEDURE sp_GetStagingStats
    @BimestreId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        'staging_adol' as tabla,
        COUNT(*) as total_registros,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as procesados,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errores
    FROM staging_adol 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    UNION ALL
    
    SELECT 
        'staging_cursables',
        COUNT(*),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)
    FROM staging_cursables 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    UNION ALL
    
    SELECT 
        'staging_docentes',
        COUNT(*),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)
    FROM staging_docentes 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    UNION ALL
    
    SELECT 
        'staging_dol',
        COUNT(*),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)
    FROM staging_dol 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    UNION ALL
    
    SELECT 
        'staging_estructura_academica',
        COUNT(*),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)
    FROM staging_estructura_academica 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    UNION ALL
    
    SELECT 
        'staging_usuarios_agendador',
        COUNT(*),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)
    FROM staging_usuarios_agendador 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    UNION ALL
    
    SELECT 
        'staging_vacantes',
        COUNT(*),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)
    FROM staging_vacantes 
    WHERE (@BimestreId IS NULL OR bimestre_id = @BimestreId)
    
    ORDER BY tabla;
END;
GO

PRINT '=============================================';
PRINT 'TABLAS DE STAGING CREADAS EXITOSAMENTE';
PRINT '=============================================';
PRINT 'Tablas creadas:';
PRINT '  - staging_adol';
PRINT '  - staging_cursables';
PRINT '  - staging_docentes';
PRINT '  - staging_dol';
PRINT '  - staging_estructura_academica';
PRINT '  - staging_usuarios_agendador';
PRINT '  - staging_vacantes';
PRINT '  - staging_processing_log';
PRINT '';
PRINT 'Procedimientos creados:';
PRINT '  - sp_CleanStagingByBimestre';
PRINT '  - sp_GetStagingStats';
PRINT '';
PRINT 'Próximo paso: Implementar APIs de carga';
PRINT '=============================================';
GO