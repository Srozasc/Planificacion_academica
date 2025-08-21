-- =====================================================
-- Stored Procedure: sp_cleanup_old_bimestres
-- Propósito: Limpieza automática de bimestres obsoletos y sus dependencias
-- Fecha: 2025-01-17
-- Versión: 1.0
-- =====================================================

USE planificacion_academica;

DROP PROCEDURE IF EXISTS sp_cleanup_old_bimestres;

DELIMITER //

CREATE PROCEDURE sp_cleanup_old_bimestres(
    IN p_months_threshold INT,
    IN p_max_bimestres_per_execution INT,
    IN p_debug_mode BOOLEAN,
    IN p_perform_backup BOOLEAN,
    OUT p_execution_id VARCHAR(36),
    OUT p_bimestres_deleted INT,
    OUT p_total_records_deleted INT,
    OUT p_status VARCHAR(50),
    OUT p_error_message TEXT
)
sp_cleanup: BEGIN
    -- Variables de control
    DECLARE v_execution_start DATETIME DEFAULT NOW();
    DECLARE v_execution_end DATETIME;
    DECLARE v_log_id INT;
    DECLARE v_bimestre_count INT DEFAULT 0;
    DECLARE v_total_deleted INT DEFAULT 0;
    DECLARE v_current_bimestre_id INT;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_error_occurred BOOLEAN DEFAULT FALSE;
    DECLARE v_rollback_needed BOOLEAN DEFAULT FALSE;
    
    -- Contadores por tabla
    DECLARE v_permisos_pendientes_deleted INT DEFAULT 0;
    DECLARE v_usuario_permisos_carrera_deleted INT DEFAULT 0;
    DECLARE v_usuario_permisos_categoria_deleted INT DEFAULT 0;
    DECLARE v_schedule_events_deleted INT DEFAULT 0;
    DECLARE v_academic_structures_deleted INT DEFAULT 0;
    DECLARE v_vacantes_deleted INT DEFAULT 0;
    DECLARE v_event_teachers_deleted INT DEFAULT 0;
    DECLARE v_upload_logs_deleted INT DEFAULT 0;
    DECLARE v_dol_aprobados_deleted INT DEFAULT 0;
    DECLARE v_asignaturas_optativas_deleted INT DEFAULT 0;
    DECLARE v_reporte_cursables_deleted INT DEFAULT 0;
    DECLARE v_adol_aprobados_deleted INT DEFAULT 0;
    DECLARE v_usuario_asignaturas_permitidas_deleted INT DEFAULT 0;
    DECLARE v_asignaturas_deleted INT DEFAULT 0;
    DECLARE v_carreras_deleted INT DEFAULT 0;
    DECLARE v_teachers_deleted INT DEFAULT 0;
    
    -- Variables de validación
    DECLARE v_cutoff_date DATE;
    DECLARE v_backup_path VARCHAR(500);
    DECLARE v_total_bimestres INT DEFAULT 0;
    
    -- Cursor para bimestres a eliminar (mantiene siempre los 10 más recientes)
    DECLARE bimestre_cursor CURSOR FOR
        SELECT id 
        FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (
                       ORDER BY createdAt DESC, anoAcademico DESC, numeroBimestre DESC
                   ) as rn
            FROM bimestres 
            WHERE activo = 0 AND fechaFin < CURDATE()
        ) ranked_bimestres
        WHERE rn > 10  -- Mantener siempre los 10 más recientes
            AND EXISTS (
                SELECT 1 FROM bimestres b 
                WHERE b.id = ranked_bimestres.id 
                    AND b.createdAt <= v_cutoff_date
            )
        ORDER BY rn ASC  -- Eliminar primero los más antiguos
        LIMIT p_max_bimestres_per_execution;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    -- Handler para errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        
        SET v_error_occurred = TRUE;
        SET p_status = 'FAILED';
        
        -- Actualizar log con error
        UPDATE cleanup_logs 
        SET status = 'FAILED',
            error_message = p_error_message,
            execution_end_date = NOW(),
            execution_time_seconds = TIMESTAMPDIFF(SECOND, v_execution_start, NOW())
        WHERE id = v_log_id;
        
        -- Rollback si estamos en transacción
        ROLLBACK;
        
        RESIGNAL;
    END;
    
    -- Inicializar variables de salida
    SET p_execution_id = UUID();
    SET p_bimestres_deleted = 0;
    SET p_total_records_deleted = 0;
    SET p_status = 'STARTED';
    SET p_error_message = NULL;
    
    -- Establecer valores por defecto si son NULL
    IF p_months_threshold IS NULL THEN
        SET p_months_threshold = 24;
    END IF;
    
    IF p_max_bimestres_per_execution IS NULL THEN
        SET p_max_bimestres_per_execution = 10;
    END IF;
    
    IF p_debug_mode IS NULL THEN
        SET p_debug_mode = FALSE;
    END IF;
    
    IF p_perform_backup IS NULL THEN
        SET p_perform_backup = TRUE;
    END IF;
    
    -- Validaciones iniciales
    IF p_months_threshold < 6 THEN
        SET p_error_message = 'El umbral mínimo de meses debe ser 6';
        SET p_status = 'FAILED';
        LEAVE sp_cleanup;
    END IF;
    
    IF p_max_bimestres_per_execution < 1 OR p_max_bimestres_per_execution > 50 THEN
        SET p_error_message = 'El máximo de bimestres por ejecución debe estar entre 1 y 50';
        SET p_status = 'FAILED';
        LEAVE sp_cleanup;
    END IF;
    
    -- Calcular fecha de corte
    SET v_cutoff_date = DATE_SUB(CURDATE(), INTERVAL p_months_threshold MONTH);
    
    -- Crear registro inicial en cleanup_logs
    INSERT INTO cleanup_logs (
        execution_id, execution_date, months_threshold, 
        max_bimestres_per_execution, debug_mode, perform_backup,
        status, created_by
    ) VALUES (
        p_execution_id, v_execution_start, p_months_threshold,
        p_max_bimestres_per_execution, p_debug_mode, p_perform_backup,
        'STARTED', 'sp_cleanup_old_bimestres'
    );
    
    SET v_log_id = LAST_INSERT_ID();
    
    -- Validación: Contar total de bimestres elegibles
    SELECT COUNT(*) INTO v_total_bimestres
    FROM bimestres 
    WHERE activo = 0 AND fechaFin < CURDATE();
    
    -- Si hay 10 o menos bimestres totales, no eliminar nada
    IF v_total_bimestres <= 10 THEN
        SET p_status = 'COMPLETED';
        UPDATE cleanup_logs 
        SET status = 'COMPLETED',
            bimestres_identified = 0,
            execution_end_date = NOW(),
            execution_time_seconds = TIMESTAMPDIFF(SECOND, v_execution_start, NOW()),
            notes = CONCAT('No se eliminaron bimestres: solo hay ', v_total_bimestres, ' bimestres elegibles (≤10)')
        WHERE id = v_log_id;
        LEAVE sp_cleanup;
    END IF;
    
    -- Contar bimestres candidatos para eliminación (excluyendo los 10 más recientes)
    SELECT COUNT(*) INTO v_bimestre_count
    FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   ORDER BY createdAt DESC, anoAcademico DESC, numeroBimestre DESC
               ) as rn
        FROM bimestres 
        WHERE activo = 0 AND fechaFin < CURDATE()
    ) ranked_bimestres
    WHERE rn > 10  -- Mantener siempre los 10 más recientes
        AND EXISTS (
            SELECT 1 FROM bimestres b 
            WHERE b.id = ranked_bimestres.id 
                AND b.createdAt <= v_cutoff_date
        );
    
    -- Actualizar conteo identificado
    UPDATE cleanup_logs 
    SET bimestres_identified = v_bimestre_count,
        status = 'IN_PROGRESS'
    WHERE id = v_log_id;
    
    -- Si no hay bimestres para procesar
    IF v_bimestre_count = 0 THEN
        SET p_status = 'COMPLETED';
        UPDATE cleanup_logs 
        SET status = 'COMPLETED',
            execution_end_date = NOW(),
            execution_time_seconds = TIMESTAMPDIFF(SECOND, v_execution_start, NOW())
        WHERE id = v_log_id;
        LEAVE sp_cleanup;
    END IF;
    
    -- Modo debug: solo simular
    IF p_debug_mode THEN
        SET p_status = 'COMPLETED';
        SET p_bimestres_deleted = LEAST(v_bimestre_count, p_max_bimestres_per_execution);
        
        UPDATE cleanup_logs 
        SET status = 'COMPLETED',
            bimestres_deleted = p_bimestres_deleted,
            execution_end_date = NOW(),
            execution_time_seconds = TIMESTAMPDIFF(SECOND, v_execution_start, NOW())
        WHERE id = v_log_id;
        
        LEAVE sp_cleanup;
    END IF;
    
    -- Iniciar transacción para eliminaciones reales
    START TRANSACTION;
    
    -- Abrir cursor y procesar bimestres
    OPEN bimestre_cursor;
    
    bimestre_loop: LOOP
        FETCH bimestre_cursor INTO v_current_bimestre_id;
        
        IF v_done THEN
            LEAVE bimestre_loop;
        END IF;
        
        -- Eliminar dependencias en orden correcto
        
        -- 1. Tablas de permisos (deben eliminarse primero por dependencias)
        DELETE FROM permisos_pendientes WHERE bimestre_id = v_current_bimestre_id;
        SET v_permisos_pendientes_deleted = v_permisos_pendientes_deleted + ROW_COUNT();
        
        DELETE FROM usuario_permisos_carrera WHERE bimestre_id = v_current_bimestre_id;
        SET v_usuario_permisos_carrera_deleted = v_usuario_permisos_carrera_deleted + ROW_COUNT();
        
        DELETE FROM usuario_permisos_categoria WHERE bimestre_id = v_current_bimestre_id;
        SET v_usuario_permisos_categoria_deleted = v_usuario_permisos_categoria_deleted + ROW_COUNT();
        
        -- 2. schedule_events
        DELETE FROM schedule_events WHERE bimestre_id = v_current_bimestre_id;
        SET v_schedule_events_deleted = v_schedule_events_deleted + ROW_COUNT();
        
        -- 3. academic_structures
        DELETE FROM academic_structures WHERE bimestre_id = v_current_bimestre_id;
        SET v_academic_structures_deleted = v_academic_structures_deleted + ROW_COUNT();
        
        -- 4. vacantes_inicio_permanente
        DELETE FROM vacantes_inicio_permanente WHERE bimestre_id = v_current_bimestre_id;
        SET v_vacantes_deleted = v_vacantes_deleted + ROW_COUNT();
        
        -- 5. event_teachers (si existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'planificacion_academica' 
                  AND table_name = 'event_teachers') THEN
            DELETE FROM event_teachers WHERE bimestre_id = v_current_bimestre_id;
            SET v_event_teachers_deleted = v_event_teachers_deleted + ROW_COUNT();
        END IF;
        
        -- 6. upload_logs
        DELETE FROM upload_logs WHERE bimestre_id = v_current_bimestre_id;
        SET v_upload_logs_deleted = v_upload_logs_deleted + ROW_COUNT();
        
        -- 7. dol_aprobados (si existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'planificacion_academica' 
                  AND table_name = 'dol_aprobados') THEN
            DELETE FROM dol_aprobados WHERE bimestre_id = v_current_bimestre_id;
            SET v_dol_aprobados_deleted = v_dol_aprobados_deleted + ROW_COUNT();
        END IF;
        
        -- 8. asignaturas_optativas_aprobadas (si existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'planificacion_academica' 
                  AND table_name = 'asignaturas_optativas_aprobadas') THEN
            DELETE FROM asignaturas_optativas_aprobadas WHERE bimestre_id = v_current_bimestre_id;
            SET v_asignaturas_optativas_deleted = v_asignaturas_optativas_deleted + ROW_COUNT();
        END IF;
        
        -- 9. reporte_cursables_aprobados (si existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'planificacion_academica' 
                  AND table_name = 'reporte_cursables_aprobados') THEN
            DELETE FROM reporte_cursables_aprobados WHERE bimestre_id = v_current_bimestre_id;
            SET v_reporte_cursables_deleted = v_reporte_cursables_deleted + ROW_COUNT();
        END IF;
        
        -- 10. adol_aprobados (si existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'planificacion_academica' 
                  AND table_name = 'adol_aprobados') THEN
            DELETE FROM adol_aprobados WHERE bimestre_id = v_current_bimestre_id;
            SET v_adol_aprobados_deleted = v_adol_aprobados_deleted + ROW_COUNT();
        END IF;
        
        -- 11. usuario_asignaturas_permitidas (si existe)
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'planificacion_academica' 
                  AND table_name = 'usuario_asignaturas_permitidas') THEN
            DELETE FROM usuario_asignaturas_permitidas WHERE bimestre_id = v_current_bimestre_id;
            SET v_usuario_asignaturas_permitidas_deleted = v_usuario_asignaturas_permitidas_deleted + ROW_COUNT();
        END IF;
        
        -- 12. asignaturas (eliminar después de sus dependencias)
        DELETE FROM asignaturas WHERE bimestre_id = v_current_bimestre_id;
        SET v_asignaturas_deleted = v_asignaturas_deleted + ROW_COUNT();
        
        -- 13. teachers (eliminar después de asignaturas)
        DELETE FROM teachers WHERE id_bimestre = v_current_bimestre_id;
        SET v_teachers_deleted = v_teachers_deleted + ROW_COUNT();
        
        -- 14. carreras (eliminar después de asignaturas y teachers)
        DELETE FROM carreras WHERE bimestre_id = v_current_bimestre_id;
        SET v_carreras_deleted = v_carreras_deleted + ROW_COUNT();
        
        -- 8. Finalmente, eliminar el bimestre
        DELETE FROM bimestres WHERE id = v_current_bimestre_id;
        
        SET p_bimestres_deleted = p_bimestres_deleted + 1;
        
    END LOOP;
    
    CLOSE bimestre_cursor;
    
    -- Calcular total de registros eliminados
    SET p_total_records_deleted = v_permisos_pendientes_deleted + v_usuario_permisos_carrera_deleted + 
                                 v_usuario_permisos_categoria_deleted + v_schedule_events_deleted + 
                                 v_academic_structures_deleted + v_vacantes_deleted + 
                                 v_event_teachers_deleted + v_upload_logs_deleted + 
                                 v_dol_aprobados_deleted + v_asignaturas_optativas_deleted + 
                                 v_reporte_cursables_deleted + v_adol_aprobados_deleted + 
                                 v_usuario_asignaturas_permitidas_deleted + v_asignaturas_deleted + 
                                 v_teachers_deleted + v_carreras_deleted + p_bimestres_deleted;
    
    -- Commit de la transacción
    COMMIT;
    
    -- Actualizar estado final
    SET p_status = 'COMPLETED';
    SET v_execution_end = NOW();
    
    -- Actualizar log final
    UPDATE cleanup_logs 
    SET status = 'COMPLETED',
        bimestres_deleted = p_bimestres_deleted,
        schedule_events_deleted = v_schedule_events_deleted,
        academic_structures_deleted = v_academic_structures_deleted,
        vacantes_inicio_permanente_deleted = v_vacantes_deleted,
        event_teachers_deleted = v_event_teachers_deleted,
        upload_logs_deleted = v_upload_logs_deleted,
        dol_aprobados_deleted = v_dol_aprobados_deleted,
        asignaturas_optativas_aprobadas_deleted = v_asignaturas_optativas_deleted,
        execution_end_date = v_execution_end,
        execution_time_seconds = TIMESTAMPDIFF(SECOND, v_execution_start, v_execution_end),
        notes = CONCAT('Tablas adicionales procesadas: permisos_pendientes(', v_permisos_pendientes_deleted, 
                      '), usuario_permisos_carrera(', v_usuario_permisos_carrera_deleted,
                      '), usuario_permisos_categoria(', v_usuario_permisos_categoria_deleted,
                      '), reporte_cursables_aprobados(', v_reporte_cursables_deleted,
                      '), adol_aprobados(', v_adol_aprobados_deleted,
                      '), usuario_asignaturas_permitidas(', v_usuario_asignaturas_permitidas_deleted,
                      '), asignaturas(', v_asignaturas_deleted,
                      '), teachers(', v_teachers_deleted,
                      '), carreras(', v_carreras_deleted, ')')
    WHERE id = v_log_id;
    
END//

DELIMITER ;

-- Verificar la creación del procedimiento
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    DEFINER,
    CREATED,
    LAST_ALTERED,
    ROUTINE_COMMENT
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'planificacion_academica' 
    AND ROUTINE_NAME = 'sp_cleanup_old_bimestres';

-- Mostrar parámetros del procedimiento
SELECT 
    PARAMETER_NAME,
    PARAMETER_MODE,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM information_schema.PARAMETERS 
WHERE SPECIFIC_SCHEMA = 'planificacion_academica' 
    AND SPECIFIC_NAME = 'sp_cleanup_old_bimestres'
ORDER BY ORDINAL_POSITION;

-- Comentarios sobre el uso del procedimiento:
-- 
-- EJECUCIÓN EN MODO DEBUG (recomendado para primera vez):
-- CALL sp_cleanup_old_bimestres(24, 5, TRUE, FALSE, @exec_id, @deleted, @total, @status, @error);
-- SELECT @exec_id, @deleted, @total, @status, @error;
--
-- EJECUCIÓN EN PRODUCCIÓN:
-- CALL sp_cleanup_old_bimestres(24, 10, FALSE, TRUE, @exec_id, @deleted, @total, @status, @error);
-- SELECT @exec_id, @deleted, @total, @status, @error;
--
-- CONSULTAR LOGS:
-- SELECT * FROM cleanup_logs ORDER BY execution_date DESC LIMIT 10;