USE planificacion_academica;

DROP PROCEDURE IF EXISTS sp_DeleteScheduleEvent;

DELIMITER $$

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

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos durante la eliminación';
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Inicializar variables de salida
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;

    -- 1. VERIFICAR EXISTENCIA DEL EVENTO
    SELECT COUNT(*), status_id INTO v_event_exists, v_current_status_id
    FROM schedule_events
    WHERE id = p_event_id AND is_active = TRUE;

    IF v_event_exists = 0 THEN
        SET o_status_code = 'NOT_FOUND';
        SET o_error_message = 'El evento especificado no existe o ya fue eliminado';
        ROLLBACK;
    ELSE
        -- 2. REALIZAR ELIMINACIÓN
        IF p_logical_delete THEN
            -- Eliminación lógica
            UPDATE schedule_events
            SET is_active = FALSE,
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_event_id;
            
            SET o_status_code = 'SUCCESS';
            SET o_error_message = 'Evento eliminado lógicamente';
        ELSE
            -- Eliminación física
            DELETE FROM schedule_events WHERE id = p_event_id;
            
            SET o_status_code = 'SUCCESS';
            SET o_error_message = 'Evento eliminado físicamente';
        END IF;
        
        COMMIT;
    END IF;
END$$

DELIMITER ;

SELECT 'sp_DeleteScheduleEvent actualizado y simplificado' as mensaje;
