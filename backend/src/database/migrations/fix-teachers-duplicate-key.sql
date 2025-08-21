-- =============================================
-- Script: fix-teachers-duplicate-key.sql
-- Propósito: Agregar clave única compuesta para prevenir duplicados
-- Fecha: 2025-01-30
-- Descripción: Soluciona el problema de duplicación de registros
--              en sp_migrate_staging_nomina_docentes_to_teachers
-- =============================================

USE planificacion_academica;

-- Verificar estructura actual de la tabla
SELECT 'Estructura ANTES de la corrección:' AS info;
DESCRIBE teachers;

-- Mostrar índices actuales
SELECT 'Índices ANTES de la corrección:' AS info;
SHOW INDEX FROM teachers;

-- Verificar si ya existe la clave única compuesta
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'planificacion_academica'
    AND TABLE_NAME = 'teachers'
    AND INDEX_NAME = 'unique_teacher_bimestre'
);

-- Solo agregar la clave única si no existe
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE teachers ADD UNIQUE KEY unique_teacher_bimestre (rut, id_bimestre);',
    'SELECT "La clave única compuesta ya existe" AS mensaje;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que la clave única se agregó correctamente
SELECT 'Estructura DESPUÉS de la corrección:' AS info;
DESCRIBE teachers;

-- Mostrar índices después de la corrección
SELECT 'Índices DESPUÉS de la corrección:' AS info;
SHOW INDEX FROM teachers;

-- Verificar registros duplicados existentes
SELECT 'Verificando duplicados existentes:' AS info;
SELECT 
    rut, 
    id_bimestre, 
    COUNT(*) as cantidad_duplicados
FROM teachers 
WHERE rut IS NOT NULL 
  AND id_bimestre IS NOT NULL
GROUP BY rut, id_bimestre 
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- Mostrar estadísticas de la tabla
SELECT 
    'teachers' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT rut) as ruts_unicos,
    COUNT(DISTINCT id_bimestre) as bimestres_unicos,
    COUNT(CASE WHEN rut IS NOT NULL AND id_bimestre IS NOT NULL THEN 1 END) as registros_con_rut_y_bimestre
FROM teachers;

SELECT 'Corrección completada: Clave única compuesta agregada a teachers' AS status;

-- =============================================
-- COMENTARIOS SOBRE LA SOLUCIÓN
-- =============================================

/*
Esta migración soluciona el problema de duplicación implementando:

1. CLAVE ÚNICA COMPUESTA (rut, id_bimestre):
   - Previene que el mismo docente (RUT) tenga múltiples registros en el mismo bimestre
   - Permite que el mismo docente exista en diferentes bimestres
   - Activa correctamente ON DUPLICATE KEY UPDATE en el SP

2. VERIFICACIÓN DE DUPLICADOS:
   - Consulta para identificar registros duplicados existentes
   - Estadísticas de la tabla para monitoreo

3. COMPATIBILIDAD:
   - Verifica si la clave única ya existe antes de crearla
   - No afecta datos existentes válidos
   - Mantiene la funcionalidad actual del sistema

DESPUÉS DE ESTA MIGRACIÓN:
- sp_migrate_staging_nomina_docentes_to_teachers funcionará correctamente
- No se crearán registros duplicados
- ON DUPLICATE KEY UPDATE se ejecutará cuando corresponda
- Se mantiene la integridad de datos
*/