-- Stored Procedure: sp_ValidateAndSaveScheduleEvent (CRÍTICO)
-- Descripción: SP central para crear/actualizar eventos con validaciones de negocio completas
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica
-- Incluye: Funcionalidad 4 - Validaciones críticas de programación

DELIMITER $$

CREATE PROCEDURE sp_ValidateAndSaveScheduleEvent(
    IN p_event_data JSON,           -- Datos del evento en formato JSON
    IN p_user_id INT,              -- ID del usuario que ejecuta la operación
    OUT o_event_id INT,            -- ID del evento creado/actualizado
    OUT o_status_code VARCHAR(50), -- Código de estado del resultado
    OUT o_error_message TEXT       -- Mensaje de error detallado
)
BEGIN
    -- Variables para extraer datos del JSON
    DECLARE v_event_id INT DEFAULT NULL;
    DECLARE v_academic_structure_id INT;
    DECLARE v_teacher_id INT;
    DECLARE v_area_id INT;
    DECLARE v_start_datetime DATETIME;
    DECLARE v_end_datetime DATETIME;
    DECLARE v_day_of_week VARCHAR(10);
    DECLARE v_classroom VARCHAR(50);
    DECLARE v_vacancies INT;
    DECLARE v_max_capacity INT;
    DECLARE v_status_id INT DEFAULT 1; -- Borrador por defecto
    DECLARE v_weekly_hours DECIMAL(4,2);
    DECLARE v_academic_period VARCHAR(20);
    DECLARE v_section VARCHAR(10);
    DECLARE v_is_recurring BOOLEAN DEFAULT FALSE;
    DECLARE v_recurrence_end_date DATE;
    
    -- Variables para validaciones
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_current_teacher_hours DECIMAL(6,2) DEFAULT 0;
    DECLARE v_max_teacher_hours DECIMAL(6,2) DEFAULT 40;
    DECLARE v_max_events_per_day INT DEFAULT 8;
    DECLARE v_current_events_day INT DEFAULT 0;
    DECLARE v_academic_structure_exists INT DEFAULT 0;
    DECLARE v_teacher_exists INT DEFAULT 0;
    DECLARE v_classroom_conflict INT DEFAULT 0;
    DECLARE v_is_update BOOLEAN DEFAULT FALSE;
    
    -- Variables de configuración
    DECLARE v_enable_conflict_validation BOOLEAN DEFAULT TRUE;
    DECLARE v_auto_approve_events BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos durante la validación';
        SET o_event_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- 1. EXTRAER DATOS DEL JSON
    SET v_event_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.id'));
    SET v_academic_structure_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.academic_structure_id'));
    SET v_teacher_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.teacher_id'));
    SET v_area_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.area_id'));
    SET v_start_datetime = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.start_datetime')), '%Y-%m-%d %H:%i:%s');
    SET v_end_datetime = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.end_datetime')), '%Y-%m-%d %H:%i:%s');
    SET v_day_of_week = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.day_of_week'));
    SET v_classroom = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.classroom'));
    SET v_vacancies = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.vacancies'));
    SET v_max_capacity = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.max_capacity'));
    SET v_weekly_hours = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.weekly_hours'));
    SET v_academic_period = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.academic_period'));
    SET v_section = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.section'));
    SET v_is_recurring = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.is_recurring')), FALSE);
    SET v_recurrence_end_date = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.recurrence_end_date')), '%Y-%m-%d');
    
    -- Determinar si es actualización
    SET v_is_update = (v_event_id IS NOT NULL AND v_event_id > 0);
    
    -- 2. OBTENER CONFIGURACIONES DEL SISTEMA
    SELECT 
        CASE WHEN config_key = 'max_teacher_hours_weekly' THEN CAST(config_value AS DECIMAL(6,2))
             ELSE v_max_teacher_hours END,
        CASE WHEN config_key = 'max_events_per_day_teacher' THEN CAST(config_value AS SIGNED)
             ELSE v_max_events_per_day END,
        CASE WHEN config_key = 'enable_conflict_validation' THEN (config_value = 'true')
             ELSE v_enable_conflict_validation END,
        CASE WHEN config_key = 'auto_approve_events' THEN (config_value = 'true')
             ELSE v_auto_approve_events END
    INTO v_max_teacher_hours, v_max_events_per_day, v_enable_conflict_validation, v_auto_approve_events
    FROM configuration 
    WHERE config_key IN ('max_teacher_hours_weekly', 'max_events_per_day_teacher', 'enable_conflict_validation', 'auto_approve_events')
    LIMIT 1;
    
    -- 3. VALIDACIONES BÁSICAS
    
    -- Validar fechas
    IF v_start_datetime >= v_end_datetime THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La fecha de inicio debe ser anterior a la fecha de fin';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- Validar existencia de estructura académica
    SELECT COUNT(*) INTO v_academic_structure_exists
    FROM academic_structures 
    WHERE id = v_academic_structure_id AND is_active = TRUE;
    
    IF v_academic_structure_exists = 0 THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La asignatura especificada no existe o no está activa';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- Validar existencia de docente
    SELECT COUNT(*) INTO v_teacher_exists
    FROM teachers 
    WHERE id = v_teacher_id AND is_active = TRUE;
    
    IF v_teacher_exists = 0 THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'El docente especificado no existe o no está activo';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- 4. VALIDACIONES DE CONFLICTOS (si están habilitadas)
    
    IF v_enable_conflict_validation THEN
        
        -- 4.1 VALIDACIÓN DE SOLAPAMIENTO DE DOCENTE
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedule_events
        WHERE teacher_id = v_teacher_id
          AND is_active = TRUE
          AND deleted_at IS NULL
          AND (
              (v_start_datetime < end_datetime AND v_end_datetime > start_datetime)
          )
          AND (v_is_update = FALSE OR id != v_event_id); -- Excluir evento actual si es actualización
        
        IF v_conflict_count > 0 THEN
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'El docente ya tiene un evento programado en el horario especificado';
            ROLLBACK;
            LEAVE sp;
        END IF;
        
        -- 4.2 VALIDACIÓN DE SOLAPAMIENTO DE AULA (si se especifica aula)
        IF v_classroom IS NOT NULL THEN
            SELECT COUNT(*) INTO v_classroom_conflict
            FROM schedule_events
            WHERE classroom = v_classroom
              AND is_active = TRUE
              AND deleted_at IS NULL
              AND (
                  (v_start_datetime < end_datetime AND v_end_datetime > start_datetime)
              )
              AND (v_is_update = FALSE OR id != v_event_id);
            
            IF v_classroom_conflict > 0 THEN
                SET o_status_code = 'VALIDATION_ERROR';
                SET o_error_message = CONCAT('El aula ', v_classroom, ' ya está ocupada en el horario especificado');
                ROLLBACK;
                LEAVE sp;
            END IF;
        END IF;
        
        -- 4.3 VALIDACIÓN DE HORAS MÁXIMAS POR DOCENTE
        -- Calcular horas actuales del docente en el período académico
        SELECT COALESCE(SUM(
            TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime) / 60.0
        ), 0) INTO v_current_teacher_hours
        FROM schedule_events
        WHERE teacher_id = v_teacher_id
          AND academic_period = v_academic_period
          AND is_active = TRUE
          AND deleted_at IS NULL
          AND status_id IN (3, 7) -- Solo eventos aprobados o programados
          AND (v_is_update = FALSE OR id != v_event_id);
        
        -- Agregar horas del evento actual
        SET v_current_teacher_hours = v_current_teacher_hours + 
            (TIMESTAMPDIFF(MINUTE, v_start_datetime, v_end_datetime) / 60.0);
        
        IF v_current_teacher_hours > v_max_teacher_hours THEN
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = CONCAT('El docente excedería las horas máximas permitidas (', v_max_teacher_hours, ' horas). Horas actuales: ', ROUND(v_current_teacher_hours, 2));
            ROLLBACK;
            LEAVE sp;
        END IF;
        
        -- 4.4 VALIDACIÓN DE EVENTOS MÁXIMOS POR DÍA
        SELECT COUNT(*) INTO v_current_events_day
        FROM schedule_events
        WHERE teacher_id = v_teacher_id
          AND DATE(start_datetime) = DATE(v_start_datetime)
          AND is_active = TRUE
          AND deleted_at IS NULL
          AND (v_is_update = FALSE OR id != v_event_id);
        
        IF v_current_events_day >= v_max_events_per_day THEN
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = CONCAT('El docente ya tiene el máximo de eventos permitidos para este día (', v_max_events_per_day, ')');
            ROLLBACK;
            LEAVE sp;
        END IF;
        
    END IF;
    
    -- 5. GUARDAR O ACTUALIZAR EVENTO
    
    -- Determinar estado inicial
    IF v_auto_approve_events THEN
        SET v_status_id = 3; -- Aprobado
    ELSE
        SET v_status_id = 1; -- Borrador
    END IF;
    
    IF v_is_update THEN
        -- ACTUALIZAR EVENTO EXISTENTE
        UPDATE schedule_events 
        SET 
            academic_structure_id = v_academic_structure_id,
            teacher_id = v_teacher_id,
            area_id = v_area_id,
            start_datetime = v_start_datetime,
            end_datetime = v_end_datetime,
            day_of_week = v_day_of_week,
            classroom = v_classroom,
            vacancies = v_vacancies,
            max_capacity = v_max_capacity,
            weekly_hours = v_weekly_hours,
            academic_period = v_academic_period,
            section = v_section,
            is_recurring = v_is_recurring,
            recurrence_end_date = v_recurrence_end_date,
            conflicts_checked = TRUE,
            validation_notes = 'Validaciones completadas exitosamente',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_event_id;
        
        SET o_event_id = v_event_id;
        
    ELSE
        -- CREAR NUEVO EVENTO
        INSERT INTO schedule_events (
            academic_structure_id,
            teacher_id,
            area_id,
            start_datetime,
            end_datetime,
            day_of_week,
            classroom,
            vacancies,
            max_capacity,
            status_id,
            weekly_hours,
            academic_period,
            section,
            is_recurring,
            recurrence_end_date,
            is_active,
            conflicts_checked,
            validation_notes,
            created_by_user_id,
            created_at
        ) VALUES (
            v_academic_structure_id,
            v_teacher_id,
            v_area_id,
            v_start_datetime,
            v_end_datetime,
            v_day_of_week,
            v_classroom,
            v_vacancies,
            v_max_capacity,
            v_status_id,
            v_weekly_hours,
            v_academic_period,
            v_section,
            v_is_recurring,
            v_recurrence_end_date,
            TRUE,
            TRUE,
            'Evento creado con validaciones exitosas',
            p_user_id,
            CURRENT_TIMESTAMP
        );
        
        SET o_event_id = LAST_INSERT_ID();
    END IF;
    
    -- Auto-aprobar si está configurado
    IF v_auto_approve_events AND v_status_id = 3 THEN
        UPDATE schedule_events 
        SET 
            approved_by = p_user_id,
            approved_at = CURRENT_TIMESTAMP,
            approval_comment = 'Auto-aprobado por configuración del sistema'
        WHERE id = o_event_id;
    END IF;
    
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;
    
    COMMIT;

END$$

DELIMITER ;
