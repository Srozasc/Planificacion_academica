-- =====================================================
-- SCRIPT PARA CREAR TABLA PERMANENTE DE REPORTE CURSABLES
-- =====================================================
-- Versión simplificada: Solo tabla e índices
-- Fecha: $(date)
-- =====================================================

-- Crear tabla permanente para datos aprobados
CREATE TABLE reporte_cursables_aprobados (
    -- Campos principales (misma estructura que staging)
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
    plan VARCHAR(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
    nivel VARCHAR(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
    sigla VARCHAR(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
    asignatura VARCHAR(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
    id_bimestre INT DEFAULT NULL,
    
    -- Campos de auditoría
    aprobado_por VARCHAR(255) NOT NULL COMMENT 'Email del usuario que aprobó los datos',
    fecha_aprobacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de aprobación',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla permanente para datos aprobados de reporte cursables';

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- =====================================================

-- Índices para optimización de consultas
CREATE INDEX idx_reporte_cursables_bimestre ON reporte_cursables_aprobados(id_bimestre);
CREATE INDEX idx_reporte_cursables_rut ON reporte_cursables_aprobados(rut);
CREATE INDEX idx_reporte_cursables_sigla ON reporte_cursables_aprobados(sigla);
CREATE INDEX idx_reporte_cursables_plan ON reporte_cursables_aprobados(plan);
CREATE INDEX idx_reporte_cursables_nivel ON reporte_cursables_aprobados(nivel);
CREATE INDEX idx_reporte_cursables_fecha_aprobacion ON reporte_cursables_aprobados(fecha_aprobacion);
CREATE INDEX idx_reporte_cursables_aprobado_por ON reporte_cursables_aprobados(aprobado_por);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_reporte_cursables_bimestre_plan_nivel ON reporte_cursables_aprobados(id_bimestre, plan, nivel);
CREATE INDEX idx_reporte_cursables_rut_bimestre ON reporte_cursables_aprobados(rut, id_bimestre);

-- Clave única compuesta para evitar duplicados (rut, sigla, id_bimestre)
ALTER TABLE reporte_cursables_aprobados 
ADD CONSTRAINT uk_reporte_cursables_rut_sigla_bimestre 
UNIQUE (rut, sigla, id_bimestre);

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

/*
Esta tabla permanente simplificada para reporte de cursables incluye:

1. ESTRUCTURA PRINCIPAL:
   - Mismos campos que staging_reporte_cursables
   - Campos de auditoría básicos (quién y cuándo aprobó)

2. ÍNDICES OPTIMIZADOS:
   - Por bimestre (consultas más frecuentes)
   - Por RUT (búsquedas de estudiantes)
   - Por sigla (búsquedas de asignaturas)
   - Por plan y nivel (filtros académicos)
   - Por fecha de aprobación (reportes temporales)
   - Por usuario aprobador (auditoría)
   - Índices compuestos para consultas complejas

USO RECOMENDADO:
- Insertar datos manualmente o desde aplicación
- La tabla permite duplicados, manejar lógica en aplicación si es necesario
- Usar los índices para optimizar consultas frecuentes
*/

-- Agregar comentarios a la tabla
ALTER TABLE reporte_cursables_aprobados COMMENT = 
'Tabla permanente para almacenar datos aprobados de reporte cursables. Incluye campos de auditoría básicos.';

-- =====================================================
-- PROCEDIMIENTO ALMACENADO PARA MIGRACIÓN
-- =====================================================

DELIMITER //
CREATE PROCEDURE sp_migrate_staging_reporte_cursables_to_permanente(
    IN p_aprobado_por VARCHAR(255)
)
BEGIN
    INSERT INTO reporte_cursables_aprobados (
        rut,
        plan,
        nivel,
        sigla,
        asignatura,
        id_bimestre,
        aprobado_por,
        fecha_aprobacion,
        fecha_creacion,
        fecha_actualizacion
    )
    SELECT 
        src.rut,
        src.plan,
        src.nivel,
        src.sigla,
        src.asignatura,
        src.id_bimestre,
        COALESCE(p_aprobado_por, 'SISTEMA'), -- aprobado_por
        NOW(), -- fecha_aprobacion
        NOW(), -- fecha_creacion
        NOW()  -- fecha_actualizacion
    FROM 
        staging_reporte_cursables src
    WHERE src.rut IS NOT NULL 
      AND src.rut != ''
      AND src.sigla IS NOT NULL 
      AND src.sigla != ''
      AND src.id_bimestre IS NOT NULL
    ON DUPLICATE KEY UPDATE
        plan = VALUES(plan),
        nivel = VALUES(nivel),
        asignatura = VALUES(asignatura),
        fecha_aprobacion = NOW(),
        aprobado_por = COALESCE(p_aprobado_por, 'SISTEMA'),
        fecha_actualizacion = NOW();
END//
DELIMITER ;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

SELECT 'Tabla, índices y procedimiento creados correctamente' as resultado;

-- Ejemplo de uso del procedimiento:
-- CALL sp_migrate_staging_reporte_cursables_to_permanente('usuario@ejemplo.com');

-- Ejemplo de consulta:
-- SELECT * FROM reporte_cursables_aprobados WHERE id_bimestre = 16 ORDER BY fecha_aprobacion DESC;