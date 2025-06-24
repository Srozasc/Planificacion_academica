-- Stored Procedure crítico: sp_ValidateAndSaveScheduleEvent
-- Simplificado para evitar problemas de compatibilidad

DROP PROCEDURE IF EXISTS sp_ValidateAndSaveScheduleEvent;

DELIMITER $$

CREATE PROCEDURE sp_ValidateAndSaveScheduleEvent(
    IN p_academic_structure_id INT,
    IN p_teacher_id INT,
    IN p_area_id INT,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_day_of_week VARCHAR(10),
    IN p_classroom VARCHAR(50),
    IN p_user_id INT,
    OUT o_event_id INT,
    OUT o_status_code VARCHAR(50),
    OUT o_error_message TEXT
)
BEGIN
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_academic_structure_exists INT DEFAULT 0;
    DECLARE v_teacher_exists INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos';
        SET o_event_id = NULL;
    END;
    
    START TRANSACTION;
      -- 1. VALIDACIONES BÁSICAS
    IF p_start_datetime >= p_end_datetime THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La fecha de inicio debe ser anterior a la fecha de fin';
        ROLLBACK;
    ELSE
        -- Continuar con validaciones...
    
    -- 2. VALIDAR EXISTENCIA DE ESTRUCTURA ACADÉMICA
    SELECT COUNT(*) INTO v_academic_structure_exists
    FROM academic_structures 
    WHERE id = p_academic_structure_id AND is_active = TRUE;
    
    IF v_academic_structure_exists = 0 THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La asignatura especificada no existe o no está activa';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- 3. VALIDAR EXISTENCIA DE DOCENTE
    SELECT COUNT(*) INTO v_teacher_exists
    FROM teachers 
    WHERE id = p_teacher_id AND is_active = TRUE;
    
    IF v_teacher_exists = 0 THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'El docente especificado no existe o no está activo';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- 4. VALIDACIÓN DE SOLAPAMIENTO DE DOCENTE
    SELECT COUNT(*) INTO v_conflict_count
    FROM schedule_events
    WHERE teacher_id = p_teacher_id
      AND is_active = TRUE
      AND deleted_at IS NULL
      AND (
          (p_start_datetime < end_datetime AND p_end_datetime > start_datetime)
      );
    
    IF v_conflict_count > 0 THEN
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'El docente ya tiene un evento programado en el horario especificado';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- 5. CREAR NUEVO EVENTO
    INSERT INTO schedule_events (
        academic_structure_id,
        teacher_id,
        area_id,
        start_datetime,
        end_datetime,
        day_of_week,
        classroom,
        status_id,
        is_active,
        conflicts_checked,
        validation_notes,
        created_by_user_id,
        created_at
    ) VALUES (
        p_academic_structure_id,
        p_teacher_id,
        p_area_id,
        p_start_datetime,
        p_end_datetime,
        p_day_of_week,
        p_classroom,
        1, -- Borrador
        TRUE,
        TRUE,
        'Evento creado con validaciones exitosas',
        p_user_id,
        CURRENT_TIMESTAMP
    );
    
    SET o_event_id = LAST_INSERT_ID();
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;
    
    COMMIT;

END$$

DELIMITER ;
