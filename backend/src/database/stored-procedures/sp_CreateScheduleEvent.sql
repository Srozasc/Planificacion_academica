-- Stored Procedure for Creating Schedule Events
-- sp_CreateScheduleEvent
DELIMITER $$

CREATE PROCEDURE sp_ValidateAndSaveScheduleEvent(
    IN p_event_data JSON,
    IN p_user_id INT,
    OUT o_event_id INT,
    OUT o_status VARCHAR(50),
    OUT o_error_message TEXT
)
BEGIN
    DECLARE v_asignatura_id INT;
    DECLARE v_docente_id INT;
    DECLARE v_start_datetime DATETIME;
    DECLARE v_end_datetime DATETIME;
    DECLARE v_area_id INT;
    DECLARE conflict_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET o_status = 'ERROR';
        SET o_error_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Extract data from JSON
    SET v_asignatura_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.asignaturaId'));
    SET v_docente_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.docenteId'));
    SET v_start_datetime = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.startDate'));
    SET v_end_datetime = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.endDate'));
    SET v_area_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.areaId'));
    
    -- Validate teacher schedule conflicts
    SELECT COUNT(*) INTO conflict_count
    FROM ScheduleEvents
    WHERE docente_id = v_docente_id
      AND ((start_datetime < v_end_datetime) AND (end_datetime > v_start_datetime));
    
    IF conflict_count > 0 THEN
        SET o_status = 'VALIDATION_ERROR';
        SET o_error_message = 'Docente ya asignado en horario solapado';
        ROLLBACK;
    ELSE
        -- Insert new schedule event
        INSERT INTO ScheduleEvents (
            asignatura_id, docente_id, start_datetime, end_datetime,
            area_id, created_by_user_id, created_at
        ) VALUES (
            v_asignatura_id, v_docente_id, v_start_datetime, v_end_datetime,
            v_area_id, p_user_id, NOW()
        );
        
        SET o_event_id = LAST_INSERT_ID();
        SET o_status = 'SUCCESS';
        SET o_error_message = NULL;
        COMMIT;
    END IF;
    
END$$

DELIMITER ;
