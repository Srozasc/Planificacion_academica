-- Script para actualizar stored procedures con nombres de columnas corregidos
-- Fecha: 2025-06-17

USE planificacion_academica;

-- Eliminar procedures existentes
DROP PROCEDURE IF EXISTS sp_GetScheduleEvents;
DROP PROCEDURE IF EXISTS sp_ValidateAndSaveScheduleEvent;
DROP PROCEDURE IF EXISTS sp_DeleteScheduleEvent;
DROP PROCEDURE IF EXISTS sp_GetScheduleStatistics;

-- Recrear sp_GetScheduleEvents con nombres de columnas corregidos
DELIMITER $$

CREATE PROCEDURE sp_GetScheduleEvents(
    IN p_area_id INT,           -- ID del área/programa (NULL para todas)
    IN p_start_date DATE,       -- Fecha inicio del rango
    IN p_end_date DATE,         -- Fecha fin del rango
    IN p_teacher_id INT,        -- ID del docente (NULL para todos)
    IN p_status_id INT          -- ID del estado (NULL para todos)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Consulta principal con joins para obtener información completa
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
        se.max_capacity,
        se.status_id,
        se.approval_comment,
        se.approved_by,
        se.approved_at,
        se.weekly_hours,
        se.academic_period,
        se.section,
        se.is_recurring,
        se.recurrence_end_date,
        se.is_active,
        se.conflicts_checked,
        se.validation_notes,
        se.created_by_user_id,
        se.created_at,
        se.updated_at,
        
        -- Información de la estructura académica (asignatura)
        ast.program_name,
        ast.name as subject_name,
        ast.subject_code,
        ast.semester,
        ast.credits,
        
        -- Información del docente
        t.name as teacher_name,
        t.email as teacher_email,
        t.phone as teacher_phone,
        t.department,
        t.contract_type,
        
        -- Información del estado
        es.name as status_name,
        es.description as status_description,
        es.color_hex as status_color,
        es.can_edit,
        es.can_delete,
        
        -- Información del usuario creador
        u.username as created_by_username,
        u.full_name as created_by_full_name,
        
        -- Información del usuario que aprobó
        ua.username as approved_by_username,
        ua.full_name as approved_by_full_name
        
    FROM schedule_events se
    
    -- Joins para obtener información relacionada
    LEFT JOIN academic_structures ast ON se.academic_structure_id = ast.id
    LEFT JOIN teachers t ON se.teacher_id = t.id
    LEFT JOIN event_statuses es ON se.status_id = es.id
    LEFT JOIN users u ON se.created_by_user_id = u.id
    LEFT JOIN users ua ON se.approved_by = ua.id
    
    WHERE 1=1
      -- Filtros opcionales
      AND (p_area_id IS NULL OR se.area_id = p_area_id)
      AND (p_start_date IS NULL OR DATE(se.start_datetime) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(se.end_datetime) <= p_end_date)
      AND (p_teacher_id IS NULL OR se.teacher_id = p_teacher_id)
      AND (p_status_id IS NULL OR se.status_id = p_status_id)
      AND se.is_active = TRUE
    
    ORDER BY se.start_datetime ASC, ast.name, t.name;
    
END$$

DELIMITER ;

-- Mensaje de confirmación
SELECT 'sp_GetScheduleEvents actualizado correctamente' as mensaje;
