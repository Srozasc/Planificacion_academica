-- =====================================================
-- Test: Validación de Protección de Bimestres Recientes
-- Propósito: Verificar que sp_cleanup_old_bimestres NUNCA elimine los 10 bimestres más recientes
-- Fecha: 2025-01-17
-- =====================================================

USE planificacion_academica;

-- Limpiar datos de prueba previos
DELETE FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%';
DELETE FROM cleanup_logs WHERE execution_id LIKE 'TEST_%';

-- =====================================================
-- TEST 1: Con menos de 10 bimestres (no debe eliminar nada)
-- =====================================================

SELECT '=== TEST 1: Menos de 10 bimestres ===' as test_case;

-- Crear solo 5 bimestres de prueba (todos antiguos)
INSERT INTO bimestres (nombre, fechaInicio, fechaFin, anoAcademico, numeroBimestre, activo, createdAt) VALUES
('TEST_PROTECTION_1', '2020-01-01', '2020-02-28', 2020, 1, 0, '2020-01-01 00:00:00'),
('TEST_PROTECTION_2', '2020-03-01', '2020-04-30', 2020, 2, 0, '2020-03-01 00:00:00'),
('TEST_PROTECTION_3', '2021-01-01', '2021-02-28', 2021, 1, 0, '2021-01-01 00:00:00'),
('TEST_PROTECTION_4', '2021-03-01', '2021-04-30', 2021, 2, 0, '2021-03-01 00:00:00'),
('TEST_PROTECTION_5', '2022-01-01', '2022-02-28', 2022, 1, 0, '2022-01-01 00:00:00');

-- Contar bimestres antes del test
SET @count_before = (SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%');
SELECT CONCAT('Bimestres antes del cleanup: ', @count_before) as info;

-- Ejecutar SP con parámetros que normalmente eliminarían todos (6 meses de antigüedad)
CALL sp_cleanup_old_bimestres(
    6,      -- 6 meses (muy agresivo)
    20,     -- máximo 20 por ejecución
    FALSE,  -- no debug
    FALSE,  -- no backup
    @exec_id, @deleted, @total, @status, @error
);

-- Verificar resultados
SET @count_after = (SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%');
SELECT 
    @exec_id as execution_id,
    @deleted as bimestres_deleted,
    @total as total_records_deleted,
    @status as status,
    @error as error_message,
    @count_before as count_before,
    @count_after as count_after,
    CASE 
        WHEN @count_before = @count_after AND @deleted = 0 THEN '✅ PASADO'
        ELSE '❌ FALLIDO'
    END as test_result;

-- Verificar log
SELECT notes FROM cleanup_logs WHERE execution_id = @exec_id;

-- =====================================================
-- TEST 2: Con exactamente 10 bimestres (no debe eliminar nada)
-- =====================================================

SELECT '=== TEST 2: Exactamente 10 bimestres ===' as test_case;

-- Agregar 5 bimestres más para tener exactamente 10
INSERT INTO bimestres (nombre, fechaInicio, fechaFin, anoAcademico, numeroBimestre, activo, createdAt) VALUES
('TEST_PROTECTION_6', '2022-03-01', '2022-04-30', 2022, 2, 0, '2022-03-01 00:00:00'),
('TEST_PROTECTION_7', '2023-01-01', '2023-02-28', 2023, 1, 0, '2023-01-01 00:00:00'),
('TEST_PROTECTION_8', '2023-03-01', '2023-04-30', 2023, 2, 0, '2023-03-01 00:00:00'),
('TEST_PROTECTION_9', '2023-05-01', '2023-06-30', 2023, 3, 0, '2023-05-01 00:00:00'),
('TEST_PROTECTION_10', '2023-07-01', '2023-08-31', 2023, 4, 0, '2023-07-01 00:00:00');

-- Contar bimestres antes del test
SET @count_before = (SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%');
SELECT CONCAT('Bimestres antes del cleanup: ', @count_before) as info;

-- Ejecutar SP
CALL sp_cleanup_old_bimestres(
    6,      -- 6 meses
    20,     -- máximo 20 por ejecución
    FALSE,  -- no debug
    FALSE,  -- no backup
    @exec_id2, @deleted2, @total2, @status2, @error2
);

-- Verificar resultados
SET @count_after = (SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%');
SELECT 
    @exec_id2 as execution_id,
    @deleted2 as bimestres_deleted,
    @total2 as total_records_deleted,
    @status2 as status,
    @error2 as error_message,
    @count_before as count_before,
    @count_after as count_after,
    CASE 
        WHEN @count_before = @count_after AND @deleted2 = 0 THEN '✅ PASADO'
        ELSE '❌ FALLIDO'
    END as test_result;

-- =====================================================
-- TEST 3: Con más de 10 bimestres (debe eliminar solo los más antiguos)
-- =====================================================

SELECT '=== TEST 3: Más de 10 bimestres ===' as test_case;

-- Agregar 5 bimestres más para tener 15 total
INSERT INTO bimestres (nombre, fechaInicio, fechaFin, anoAcademico, numeroBimestre, activo, createdAt) VALUES
('TEST_PROTECTION_11', '2019-01-01', '2019-02-28', 2019, 1, 0, '2019-01-01 00:00:00'),
('TEST_PROTECTION_12', '2019-03-01', '2019-04-30', 2019, 2, 0, '2019-03-01 00:00:00'),
('TEST_PROTECTION_13', '2019-05-01', '2019-06-30', 2019, 3, 0, '2019-05-01 00:00:00'),
('TEST_PROTECTION_14', '2019-07-01', '2019-08-31', 2019, 4, 0, '2019-07-01 00:00:00'),
('TEST_PROTECTION_15', '2019-09-01', '2019-10-31', 2019, 5, 0, '2019-09-01 00:00:00');

-- Contar bimestres antes del test
SET @count_before = (SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%');
SELECT CONCAT('Bimestres antes del cleanup: ', @count_before) as info;

-- Identificar los 10 más recientes ANTES del cleanup
SELECT 'Los 10 bimestres más recientes (NO deben eliminarse):' as info;
SELECT nombre, createdAt, anoAcademico, numeroBimestre
FROM (
    SELECT nombre, createdAt, anoAcademico, numeroBimestre,
           ROW_NUMBER() OVER (ORDER BY createdAt DESC, anoAcademico DESC, numeroBimestre DESC) as rn
    FROM bimestres 
    WHERE nombre LIKE 'TEST_PROTECTION_%'
) ranked
WHERE rn <= 10
ORDER BY rn;

-- Ejecutar SP
CALL sp_cleanup_old_bimestres(
    6,      -- 6 meses
    10,     -- máximo 10 por ejecución
    FALSE,  -- no debug
    FALSE,  -- no backup
    @exec_id3, @deleted3, @total3, @status3, @error3
);

-- Verificar resultados
SET @count_after = (SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%');
SELECT 
    @exec_id3 as execution_id,
    @deleted3 as bimestres_deleted,
    @total3 as total_records_deleted,
    @status3 as status,
    @error3 as error_message,
    @count_before as count_before,
    @count_after as count_after,
    (@count_before - @count_after) as actually_deleted,
    CASE 
        WHEN @count_after = 10 AND @deleted3 = (@count_before - 10) THEN '✅ PASADO'
        ELSE '❌ FALLIDO'
    END as test_result;

-- Verificar que los 10 más recientes siguen existiendo
SELECT 'Verificación: Los 10 bimestres más recientes después del cleanup:' as info;
SELECT nombre, createdAt, anoAcademico, numeroBimestre
FROM (
    SELECT nombre, createdAt, anoAcademico, numeroBimestre,
           ROW_NUMBER() OVER (ORDER BY createdAt DESC, anoAcademico DESC, numeroBimestre DESC) as rn
    FROM bimestres 
    WHERE nombre LIKE 'TEST_PROTECTION_%'
) ranked
WHERE rn <= 10
ORDER BY rn;

-- =====================================================
-- TEST 4: Verificar que los más antiguos fueron eliminados
-- =====================================================

SELECT 'Bimestres que deberían haber sido eliminados (los 5 más antiguos):' as info;
SELECT 'TEST_PROTECTION_1, TEST_PROTECTION_2, TEST_PROTECTION_11, TEST_PROTECTION_12, TEST_PROTECTION_13' as expected_deleted;

-- Verificar cuáles siguen existiendo
SELECT 'Bimestres que AÚN existen:' as info;
SELECT nombre, createdAt 
FROM bimestres 
WHERE nombre LIKE 'TEST_PROTECTION_%'
ORDER BY createdAt ASC;

-- =====================================================
-- RESUMEN DE RESULTADOS
-- =====================================================

SELECT '=== RESUMEN DE TESTS ===' as summary;

SELECT 
    execution_id,
    status,
    bimestres_identified,
    bimestres_deleted,
    notes,
    execution_date
FROM cleanup_logs 
WHERE execution_id IN (@exec_id, @exec_id2, @exec_id3)
ORDER BY execution_date;

-- =====================================================
-- LIMPIEZA
-- =====================================================

-- Limpiar datos de prueba
DELETE FROM bimestres WHERE nombre LIKE 'TEST_PROTECTION_%';
DELETE FROM cleanup_logs WHERE execution_id IN (@exec_id, @exec_id2, @exec_id3);

SELECT '✅ Tests completados y datos de prueba limpiados' as final_message;