USE planificacion_academica;

DROP PROCEDURE IF EXISTS sp_ValidateAndSaveScheduleEvent;

DELIMITER $$

CREATE PROCEDURE sp_ValidateAndSaveScheduleEvent(
    IN p_event_data JSON,
    IN p_user_id INT,
    OUT o_event_id INT,
    OUT o_status_code VARCHAR(50),
    OUT o_error_message TEXT
)
BEGIN
    DECLARE v_academic_structure_id INT;
    DECLARE v_teacher_id INT;
    DECLARE v_area_id INT;
    DECLARE v_start_datetime DATETIME;
    DECLARE v_end_datetime DATETIME;
    DECLARE v_day_of_week VARCHAR(10);
    DECLARE v_classroom VARCHAR(50);
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_academic_structure_exists INT DEFAULT 0;
    DECLARE v_teacher_exists INT DEFAULT 0;
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos';
        SET o_event_id = NULL;
    END;

    START TRANSACTION;

    -- Extraer datos del JSON
    SET v_academic_structure_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.academic_structure_id'));
    SET v_teacher_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.teacher_id'));
    SET v_area_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.area_id'));
    SET v_start_datetime = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.start_datetime')), '%Y-%m-%d %H:%i:%s');
    SET v_end_datetime = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.end_datetime')), '%Y-%m-%d %H:%i:%s');
    SET v_day_of_week = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.day_of_week'));
    SET v_classroom = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.classroom'));

    -- Inicializar variables de salida
    SET o_event_id = NULL;
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;

    -- 1. VALIDACIONES BÁSICAS
    IF v_start_datetime >= v_end_datetime THEN
        SET v_validation_passed = FALSE;
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La fecha de inicio debe ser anterior a la fecha de fin';
    END IF;

    -- 2. VALIDAR EXISTENCIA DE ESTRUCTURA ACADÉMICA
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_academic_structure_exists
        FROM academic_structures
        WHERE id = v_academic_structure_id AND is_active = TRUE;

        IF v_academic_structure_exists = 0 THEN
            SET v_validation_passed = FALSE;
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'La asignatura especificada no existe o no está activa';
        END IF;
    END IF;

    -- 3. VALIDAR EXISTENCIA DE DOCENTE
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_teacher_exists
        FROM teachers
        WHERE id = v_teacher_id AND is_active = TRUE;

        IF v_teacher_exists = 0 THEN
            SET v_validation_passed = FALSE;
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'El docente especificado no existe o no está activo';
        END IF;
    END IF;

    -- 4. VALIDACIÓN DE SOLAPAMIENTO DE DOCENTE
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedule_events
        WHERE teacher_id = v_teacher_id
        AND is_active = TRUE
          AND (
              (v_start_datetime < end_datetime AND v_end_datetime > start_datetime)
          );

        IF v_conflict_count > 0 THEN
            SET v_validation_passed = FALSE;
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'El docente ya tiene un evento programado en el horario especificado';
        END IF;
    END IF;

    -- 5. CREAR EVENTO SI TODAS LAS VALIDACIONES PASARON
    IF v_validation_passed THEN
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
            v_academic_structure_id,
            v_teacher_id,
            v_area_id,
            v_start_datetime,
            v_end_datetime,
            v_day_of_week,
            v_classroom,
            1,
            TRUE,
            TRUE,
            'Evento creado con validaciones exitosas',
            p_user_id,
            CURRENT_TIMESTAMP
        );

        SET o_event_id = LAST_INSERT_ID();
        SET o_status_code = 'SUCCESS';
        SET o_error_message = 'Evento creado exitosamente';
        COMMIT;
    ELSE
        ROLLBACK;
    END IF;
END$$

DELIMITER ;

SELECT 'sp_ValidateAndSaveScheduleEvent actualizado con formato JSON' as mensaje;
