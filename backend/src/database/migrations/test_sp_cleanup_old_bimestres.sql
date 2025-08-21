-- =====================================================
-- Scripts de Testing para sp_cleanup_old_bimestres
-- Propósito: Validar el funcionamiento del SP en diferentes escenarios
-- Fecha: 2025-01-17
-- =====================================================

USE planificacion_academica;

-- =====================================================
-- PREPARACIÓN DE DATOS DE PRUEBA
-- =====================================================

-- Limpiar datos de prueba anteriores
DELETE FROM cleanup_logs WHERE created_by LIKE '%test%';

-- Verificar estado inicial de bimestres
SELECT 
    'Estado inicial de bimestres' as test_section,
    COUNT(*) as total_bimestres,
    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos,
    SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as inactivos,
    MIN(createdAt) as fecha_mas_antigua,
    MAX(createdAt) as fecha_mas_reciente
FROM bimestres;

-- =====================================================
-- TEST 1: VALIDACIÓN DE PARÁMETROS
-- =====================================================

SELECT '\n=== TEST 1: VALIDACIÓN DE PARÁMETROS ===' as test_info;

-- Test 1.1: Parámetro months_threshold muy bajo (debe fallar)
SELECT 'Test 1.1: months_threshold = 3 (debe fallar)' as subtest;
CALL sp_cleanup_old_bimestres(3, 5, TRUE, FALSE, @exec_id_1, @deleted_1, @total_1, @status_1, @error_1);
SELECT @exec_id_1 as execution_id, @status_1 as status, @error_1 as error_message;

-- Test 1.2: Parámetro max_bimestres_per_execution muy alto (debe fallar)
SELECT 'Test 1.2: max_bimestres_per_execution = 100 (debe fallar)' as subtest;
CALL sp_cleanup_old_bimestres(24, 100, TRUE, FALSE, @exec_id_2, @deleted_2, @total_2, @status_2, @error_2);
SELECT @exec_id_2 as execution_id, @status_2 as status, @error_2 as error_message;

-- Test 1.3: Parámetros válidos
SELECT 'Test 1.3: Parámetros válidos' as subtest;
CALL sp_cleanup_old_bimestres(24, 10, TRUE, FALSE, @exec_id_3, @deleted_3, @total_3, @status_3, @error_3);
SELECT @exec_id_3 as execution_id, @status_3 as status, @deleted_3 as bimestres_deleted, @error_3 as error_message;

-- =====================================================
-- TEST 2: MODO DEBUG
-- =====================================================

SELECT '\n=== TEST 2: MODO DEBUG ===' as test_info;

-- Test 2.1: Ejecución en modo debug (no debe eliminar nada)
SELECT 'Test 2.1: Modo debug activado' as subtest;
CALL sp_cleanup_old_bimestres(12, 5, TRUE, FALSE, @exec_id_4, @deleted_4, @total_4, @status_4, @error_4);
SELECT @exec_id_4 as execution_id, @status_4 as status, @deleted_4 as bimestres_deleted, @total_4 as total_records;

-- Verificar que no se eliminó nada
SELECT 
    'Verificación post-debug' as verification,
    COUNT(*) as total_bimestres_after_debug
FROM bimestres;

-- =====================================================
-- TEST 3: IDENTIFICACIÓN DE CANDIDATOS
-- =====================================================

SELECT '\n=== TEST 3: IDENTIFICACIÓN DE CANDIDATOS ===' as test_info;

-- Test 3.1: Consulta manual de candidatos con diferentes umbrales
SELECT 'Test 3.1: Candidatos con umbral de 6 meses' as subtest;
SELECT 
    COUNT(*) as candidatos_6_meses
FROM bimestres 
WHERE createdAt <= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    AND activo = 0
    AND fechaFin < CURDATE();

SELECT 'Test 3.2: Candidatos con umbral de 12 meses' as subtest;
SELECT 
    COUNT(*) as candidatos_12_meses
FROM bimestres 
WHERE createdAt <= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    AND activo = 0
    AND fechaFin < CURDATE();

SELECT 'Test 3.3: Candidatos con umbral de 24 meses' as subtest;
SELECT 
    COUNT(*) as candidatos_24_meses
FROM bimestres 
WHERE createdAt <= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
    AND activo = 0
    AND fechaFin < CURDATE();

-- =====================================================
-- TEST 4: VERIFICACIÓN DE DEPENDENCIAS
-- =====================================================

SELECT '\n=== TEST 4: VERIFICACIÓN DE DEPENDENCIAS ===' as test_info;

-- Test 4.1: Conteo de registros en tablas dependientes
SELECT 'Test 4.1: Conteo de registros en tablas dependientes' as subtest;

SELECT 
    'schedule_events' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT bimestre_id) as bimestres_referenciados
FROM schedule_events
UNION ALL
SELECT 
    'event_teachers' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id_bimestre) as bimestres_referenciados
FROM event_teachers
UNION ALL
SELECT 
    'academic_structures' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id_bimestre) as bimestres_referenciados
FROM academic_structures
UNION ALL
SELECT 
    'vacantes_inicio_permanente' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id_bimestre) as bimestres_referenciados
FROM vacantes_inicio_permanente;

-- Test 4.2: Verificar integridad referencial
SELECT 'Test 4.2: Verificación de integridad referencial' as subtest;

-- Bimestres referenciados que no existen
SELECT 
    'Bimestres referenciados inexistentes en schedule_events' as check_type,
    COUNT(*) as count_issues
FROM schedule_events se
LEFT JOIN bimestres b ON se.bimestre_id = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 
    'Bimestres referenciados inexistentes en event_teachers' as check_type,
    COUNT(*) as count_issues
FROM event_teachers et
LEFT JOIN bimestres b ON et.id_bimestre = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 
    'Bimestres referenciados inexistentes en academic_structures' as check_type,
    COUNT(*) as count_issues
FROM academic_structures ac
LEFT JOIN bimestres b ON ac.id_bimestre = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 
    'Bimestres referenciados inexistentes en vacantes_inicio_permanente' as check_type,
    COUNT(*) as count_issues
FROM vacantes_inicio_permanente vip
LEFT JOIN bimestres b ON vip.id_bimestre = b.id
WHERE b.id IS NULL;

-- =====================================================
-- TEST 5: LOGGING Y AUDITORÍA
-- =====================================================

SELECT '\n=== TEST 5: LOGGING Y AUDITORÍA ===' as test_info;

-- Test 5.1: Verificar registros de log creados
SELECT 'Test 5.1: Registros de log de las pruebas' as subtest;
SELECT 
    execution_id,
    LEFT(execution_id, 8) as short_id,
    execution_date,
    status,
    months_threshold,
    max_bimestres_per_execution,
    debug_mode,
    bimestres_identified,
    bimestres_deleted,
    COALESCE(error_message, 'Sin errores') as error_status
FROM cleanup_logs 
WHERE execution_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY execution_date DESC;

-- Test 5.2: Estadísticas de ejecuciones
SELECT 'Test 5.2: Estadísticas de ejecuciones' as subtest;
SELECT 
    status,
    COUNT(*) as cantidad_ejecuciones,
    AVG(execution_time_seconds) as tiempo_promedio_segundos,
    SUM(bimestres_deleted) as total_bimestres_eliminados
FROM cleanup_logs 
WHERE execution_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY status;

-- =====================================================
-- TEST 6: RENDIMIENTO Y LÍMITES
-- =====================================================

SELECT '\n=== TEST 6: RENDIMIENTO Y LÍMITES ===' as test_info;

-- Test 6.1: Ejecución con límite bajo
SELECT 'Test 6.1: Límite de 1 bimestre por ejecución' as subtest;
CALL sp_cleanup_old_bimestres(6, 1, TRUE, FALSE, @exec_id_5, @deleted_5, @total_5, @status_5, @error_5);
SELECT @exec_id_5 as execution_id, @status_5 as status, @deleted_5 as bimestres_deleted;

-- Test 6.2: Ejecución con límite alto
SELECT 'Test 6.2: Límite de 50 bimestres por ejecución' as subtest;
CALL sp_cleanup_old_bimestres(6, 50, TRUE, FALSE, @exec_id_6, @deleted_6, @total_6, @status_6, @error_6);
SELECT @exec_id_6 as execution_id, @status_6 as status, @deleted_6 as bimestres_deleted;

-- =====================================================
-- TEST 7: CASOS ESPECIALES
-- =====================================================

SELECT '\n=== TEST 7: CASOS ESPECIALES ===' as test_info;

-- Test 7.1: Sin bimestres candidatos (umbral muy alto)
SELECT 'Test 7.1: Sin candidatos (umbral 120 meses)' as subtest;
CALL sp_cleanup_old_bimestres(120, 10, TRUE, FALSE, @exec_id_7, @deleted_7, @total_7, @status_7, @error_7);
SELECT @exec_id_7 as execution_id, @status_7 as status, @deleted_7 as bimestres_deleted;

-- =====================================================
-- RESUMEN DE RESULTADOS
-- =====================================================

SELECT '\n=== RESUMEN DE RESULTADOS DE TESTING ===' as test_info;

-- Resumen final
SELECT 
    'RESUMEN FINAL' as seccion,
    COUNT(*) as total_ejecuciones_test,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as ejecuciones_exitosas,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as ejecuciones_fallidas,
    SUM(bimestres_deleted) as total_bimestres_eliminados_test,
    AVG(execution_time_seconds) as tiempo_promedio_segundos
FROM cleanup_logs 
WHERE execution_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Estado final de la base de datos
SELECT 
    'Estado final de bimestres' as seccion,
    COUNT(*) as total_bimestres,
    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos,
    SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as inactivos
FROM bimestres;

-- Últimas 5 ejecuciones del SP
SELECT 
    'Últimas ejecuciones' as seccion,
    LEFT(execution_id, 8) as short_id,
    execution_date,
    status,
    bimestres_deleted,
    execution_time_seconds,
    COALESCE(error_message, 'OK') as resultado
FROM cleanup_logs 
ORDER BY execution_date DESC 
LIMIT 5;

-- =====================================================
-- NOTAS SOBRE LOS TESTS
-- =====================================================

/*
NOTAS IMPORTANTES SOBRE LOS TESTS:

1. TESTS DE VALIDACIÓN:
   - Verifican que los parámetros inválidos sean rechazados
   - Confirman que los parámetros válidos sean aceptados

2. TESTS DE MODO DEBUG:
   - Aseguran que no se eliminen datos reales en modo debug
   - Verifican que el conteo de candidatos sea correcto

3. TESTS DE DEPENDENCIAS:
   - Verifican la integridad referencial antes y después
   - Identifican posibles problemas de datos huérfanos

4. TESTS DE LOGGING:
   - Confirman que todos los logs se crean correctamente
   - Verifican que las métricas sean precisas

5. TESTS DE RENDIMIENTO:
   - Evalúan el comportamiento con diferentes límites
   - Miden tiempos de ejecución

6. TESTS DE CASOS ESPECIALES:
   - Manejan escenarios sin candidatos
   - Prueban condiciones límite

PARA EJECUTAR ESTOS TESTS:
1. Ejecutar en entorno de desarrollo/testing
2. Verificar que hay datos de prueba disponibles
3. Revisar todos los resultados antes de usar en producción
4. Documentar cualquier comportamiento inesperado
*/