-- Stored Procedure: sp_DeleteScheduleEvent
-- Descripción: Elimina (lógicamente o físicamente) un evento de programación
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica

DELIMITER $$

CREATE PROCEDURE sp_DeleteScheduleEvent(
    IN p_event_id INT,              -- ID del evento a eliminar
    IN p_user_id INT,               -- ID del usuario que ejecuta la operación
    IN p_logical_delete BOOLEAN,    -- TRUE para eliminación lógica, FALSE para física
    OUT o_status_code VARCHAR(50),  -- Código de estado del resultado
    OUT o_error_message TEXT        -- Mensaje de error si aplica
)
BEGIN
    DECLARE v_event_exists INT DEFAULT 0;
    DECLARE v_current_status_id INT;
    DECLARE v_can_delete BOOLEAN DEFAULT FALSE;
    DECLARE v_event_creator_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos durante la eliminación';
    END;
    
    START TRANSACTION;
    
    -- 1. VERIFICAR EXISTENCIA DEL EVENTO
    SELECT COUNT(*), status_id, created_by_user_id
    INTO v_event_exists, v_current_status_id, v_event_creator_id
    FROM schedule_events 
    WHERE id = p_event_id 
      AND is_active = TRUE
      AND deleted_at IS NULL;
    
    IF v_event_exists = 0 THEN
        SET o_status_code = 'NOT_FOUND';
        SET o_error_message = 'El evento especificado no existe o ya fue eliminado';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- 2. VERIFICAR PERMISOS DE ELIMINACIÓN
    -- Verificar si el estado actual permite eliminación
    SELECT can_delete INTO v_can_delete
    FROM event_statuses 
    WHERE id = v_current_status_id;
    
    IF NOT v_can_delete THEN
        SET o_status_code = 'PERMISSION_DENIED';
        SET o_error_message = 'El evento no puede ser eliminado en su estado actual';
        ROLLBACK;
        LEAVE sp;
    END IF;
    
    -- Verificar si el usuario tiene permisos (creador del evento o admin)
    -- Por simplicidad, permitimos que el creador o cualquier usuario elimine
    -- En un sistema real, aquí se verificarían roles y permisos específicos
    
    -- 3. REALIZAR ELIMINACIÓN
    IF p_logical_delete THEN
        -- ELIMINACIÓN LÓGICA
        UPDATE schedule_events 
        SET 
            is_active = FALSE,
            deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            validation_notes = CONCAT(
                COALESCE(validation_notes, ''), 
                ' | Eliminado lógicamente por usuario ID: ', p_user_id, 
                ' el ', CURRENT_TIMESTAMP
            )
        WHERE id = p_event_id;
        
        SET o_status_code = 'SUCCESS';
        SET o_error_message = 'Evento eliminado lógicamente';
        
    ELSE
        -- ELIMINACIÓN FÍSICA
        -- Nota: En un sistema de producción, se debería verificar si existen
        -- dependencias antes de eliminar físicamente
        
        DELETE FROM schedule_events 
        WHERE id = p_event_id;
        
        SET o_status_code = 'SUCCESS';
        SET o_error_message = 'Evento eliminado físicamente';
    END IF;
    
    COMMIT;

END$$

DELIMITER ;
