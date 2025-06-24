-- Stored Procedures corregidos con nombres de columnas reales
DROP PROCEDURE IF EXISTS sp_GetScheduleEvents;
DROP PROCEDURE IF EXISTS sp_ValidateAndSaveScheduleEvent;

DELIMITER $$

-- sp_GetScheduleEvents corregido
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
        
        -- Información de la estructura académica (usando nombres reales)
        ast.name as subject_name,
        ast.code as subject_code,
        ast.credits,
        
        -- Información del docente (usando nombres reales)
        t.name as teacher_name,
        t.email as teacher_email,
        t.rut as teacher_rut,
        
        -- Información del estado
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

-- sp_ValidateAndSaveScheduleEvent corregido
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
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos';
        SET o_event_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Inicializar variables de salida
    SET o_event_id = NULL;
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;
    
    -- 1. VALIDACIONES BÁSICAS
    IF p_start_datetime >= p_end_datetime THEN
        SET v_validation_passed = FALSE;
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La fecha de inicio debe ser anterior a la fecha de fin';
    END IF;
    
    -- 2. VALIDAR EXISTENCIA DE ESTRUCTURA ACADÉMICA
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_academic_structure_exists
        FROM academic_structures 
        WHERE id = p_academic_structure_id AND is_active = TRUE;
        
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
        WHERE id = p_teacher_id AND is_active = TRUE;
        
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
        WHERE teacher_id = p_teacher_id
          AND is_active = TRUE
          AND deleted_at IS NULL
          AND (
              (p_start_datetime < end_datetime AND p_end_datetime > start_datetime)
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
        SET o_error_message = 'Evento creado exitosamente';
        COMMIT;
    ELSE
        ROLLBACK;
    END IF;

END$$

DELIMITER ;
