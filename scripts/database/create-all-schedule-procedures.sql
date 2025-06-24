-- Script para crear todos los stored procedures de programación académica
-- create-all-schedule-procedures.sql

-- Eliminar procedures existentes si existen
DROP PROCEDURE IF EXISTS sp_GetScheduleEvents;
DROP PROCEDURE IF EXISTS sp_ValidateAndSaveScheduleEvent;
DROP PROCEDURE IF EXISTS sp_DeleteScheduleEvent;
DROP PROCEDURE IF EXISTS sp_GetScheduleStatistics;

-- Configurar delimiters
DELIMITER $$

-- sp_GetScheduleEvents
CREATE PROCEDURE sp_GetScheduleEvents(
    IN p_area_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_teacher_id INT,
    IN p_status_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    SELECT 
        se.id,
        se.academic_structure_id,
        se.teacher_id,
        se.area_id,
        se.start_datetime,
        se.end_datetime,
        se.day_of_week,
        se.classroom,
        se.vacancies,
        se.status_id,
        se.weekly_hours,
        se.academic_period,
        se.section,
        se.created_by_user_id,
        se.created_at,
        
        ast.program_name,
        ast.subject_name,
        ast.subject_code,
        
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        t.department,
        
        es.name as status_name,
        es.color_hex as status_color
        
    FROM schedule_events se
    INNER JOIN academic_structures ast ON se.academic_structure_id = ast.id
    INNER JOIN teachers t ON se.teacher_id = t.id
    INNER JOIN event_statuses es ON se.status_id = es.id
    
    WHERE 
        DATE(se.start_datetime) >= p_start_date
        AND DATE(se.end_datetime) <= p_end_date
        AND (p_area_id IS NULL OR se.area_id = p_area_id)
        AND (p_teacher_id IS NULL OR se.teacher_id = p_teacher_id)
        AND (p_status_id IS NULL OR se.status_id = p_status_id)
        AND se.is_active = TRUE
        AND se.deleted_at IS NULL
    
    ORDER BY se.start_datetime ASC;

END$$

-- sp_DeleteScheduleEvent
CREATE PROCEDURE sp_DeleteScheduleEvent(
    IN p_event_id INT,
    IN p_user_id INT,
    IN p_logical_delete BOOLEAN,
    OUT o_status_code VARCHAR(50),
    OUT o_error_message TEXT
)
BEGIN
    DECLARE v_event_exists INT DEFAULT 0;
    DECLARE v_current_status_id INT;
    DECLARE v_can_delete BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos';
    END;
    
    START TRANSACTION;
    
    SELECT COUNT(*), status_id
    INTO v_event_exists, v_current_status_id
    FROM schedule_events 
    WHERE id = p_event_id AND is_active = TRUE AND deleted_at IS NULL;
    
    IF v_event_exists = 0 THEN
        SET o_status_code = 'NOT_FOUND';
        SET o_error_message = 'El evento no existe';
        ROLLBACK;
    ELSE
        SELECT can_delete INTO v_can_delete
        FROM event_statuses WHERE id = v_current_status_id;
        
        IF NOT v_can_delete THEN
            SET o_status_code = 'PERMISSION_DENIED';
            SET o_error_message = 'El evento no puede ser eliminado en su estado actual';
            ROLLBACK;
        ELSE
            IF p_logical_delete THEN
                UPDATE schedule_events 
                SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP
                WHERE id = p_event_id;
            ELSE
                DELETE FROM schedule_events WHERE id = p_event_id;
            END IF;
            
            SET o_status_code = 'SUCCESS';
            SET o_error_message = 'Evento eliminado exitosamente';
            COMMIT;
        END IF;
    END IF;

END$$

DELIMITER ;

-- Verificar procedures creados
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'planificacion_academica' 
  AND ROUTINE_NAME LIKE 'sp_%Schedule%'
ORDER BY ROUTINE_NAME;
