-- Script para crear la tabla permanente dol_aprobados y el procedimiento almacenado
-- Archivo: create-dol-aprobados.sql
-- Descripción: Tabla permanente para almacenar datos aprobados de DOL (Distribución de Ofertas de Línea)

-- =====================================================
-- TABLA PERMANENTE: DOL_APROBADOS
-- =====================================================

CREATE TABLE dol_aprobados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan VARCHAR(50),
    sigla VARCHAR(20) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    id_bimestre INT NOT NULL,
    
    -- Campos de auditoría estándar
    aprobado_por VARCHAR(255),
    fecha_aprobacion DATETIME NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo TINYINT DEFAULT 1,
    
    -- Índices para optimizar consultas
    UNIQUE KEY unique_dol (sigla, id_bimestre),
    INDEX idx_bimestre (id_bimestre),
    INDEX idx_sigla (sigla),
    INDEX idx_plan (plan),
    INDEX idx_aprobacion (fecha_aprobacion),
    INDEX idx_aprobado_por (aprobado_por),
    
    -- Restricción de clave foránea
    CONSTRAINT FK_dol_aprobados_bimestre
    FOREIGN KEY (id_bimestre) REFERENCES bimestres(id)
);

-- Agregar comentarios a la tabla
ALTER TABLE dol_aprobados COMMENT = 
'Tabla permanente para almacenar datos aprobados de DOL. Incluye campos de auditoría y optimizaciones de consulta.';

-- =====================================================
-- PROCEDIMIENTO ALMACENADO PARA MIGRACIÓN
-- =====================================================

DELIMITER //
CREATE PROCEDURE sp_migrate_staging_dol_to_aprobados(
    IN p_aprobado_por VARCHAR(255)
)
BEGIN
    INSERT INTO dol_aprobados (
        plan,
        sigla,
        descripcion,
        id_bimestre,
        aprobado_por,
        fecha_aprobacion,
        fecha_creacion,
        fecha_actualizacion,
        activo
    )
    SELECT
        sd.plan,
        sd.sigla,
        sd.descripcion,
        sd.id_bimestre,
        COALESCE(p_aprobado_por, 'SISTEMA'),
        NOW(),
        NOW(),
        NOW(),
        1
    FROM staging_dol sd
    WHERE sd.sigla IS NOT NULL AND sd.sigla != ''
      AND sd.descripcion IS NOT NULL AND sd.descripcion != ''
      AND sd.id_bimestre IS NOT NULL
    ON DUPLICATE KEY UPDATE
        plan = VALUES(plan),
        descripcion = VALUES(descripcion),
        fecha_aprobacion = NOW(),
        aprobado_por = COALESCE(p_aprobado_por, 'SISTEMA'),
        fecha_actualizacion = NOW(),
        activo = 1;
END//
DELIMITER ;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

SELECT 'Tabla dol_aprobados, índices y procedimiento creados correctamente' as resultado;

-- Ejemplo de uso del procedimiento:
-- CALL sp_migrate_staging_dol_to_aprobados('usuario@ejemplo.com');

-- Ejemplo de consulta:
-- SELECT * FROM dol_aprobados WHERE id_bimestre = 16 ORDER BY fecha_aprobacion DESC;