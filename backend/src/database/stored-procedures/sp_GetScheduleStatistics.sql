-- Stored Procedure: sp_GetScheduleStatistics
-- Descripción: Obtiene estadísticas y métricas de la programación académica
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica

DELIMITER $$

CREATE PROCEDURE sp_GetScheduleStatistics(
    IN p_academic_period VARCHAR(20),   -- Período académico específico
    IN p_area_id INT,                   -- ID del área/programa (NULL para todas)
    IN p_teacher_id INT                 -- ID del docente (NULL para todos)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Estadísticas generales
    SELECT 
        -- Totales por estado
        COUNT(*) as total_events,
        SUM(CASE WHEN status_id = 1 THEN 1 ELSE 0 END) as draft_events,
        SUM(CASE WHEN status_id = 2 THEN 1 ELSE 0 END) as review_events,
        SUM(CASE WHEN status_id = 3 THEN 1 ELSE 0 END) as approved_events,
        SUM(CASE WHEN status_id = 4 THEN 1 ELSE 0 END) as rejected_events,
        SUM(CASE WHEN status_id = 7 THEN 1 ELSE 0 END) as scheduled_events,
        
        -- Estadísticas de horas
        SUM(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime) / 60.0) as total_hours,
        AVG(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime) / 60.0) as avg_hours_per_event,
        
        -- Estadísticas de ocupación
        COUNT(DISTINCT teacher_id) as unique_teachers,
        COUNT(DISTINCT classroom) as unique_classrooms,
        COUNT(DISTINCT academic_structure_id) as unique_subjects,
        
        -- Estadísticas temporales
        MIN(start_datetime) as earliest_event,
        MAX(end_datetime) as latest_event
        
    FROM schedule_events
    WHERE is_active = TRUE
      AND deleted_at IS NULL
      AND (p_academic_period IS NULL OR academic_period = p_academic_period)
      AND (p_area_id IS NULL OR area_id = p_area_id)
      AND (p_teacher_id IS NULL OR teacher_id = p_teacher_id);
    
    -- Estadísticas por docente
    SELECT 
        t.id as teacher_id,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
        t.department,
        COUNT(se.id) as total_events,
        SUM(TIMESTAMPDIFF(MINUTE, se.start_datetime, se.end_datetime) / 60.0) as total_hours,
        AVG(TIMESTAMPDIFF(MINUTE, se.start_datetime, se.end_datetime) / 60.0) as avg_hours_per_event,
        COUNT(DISTINCT DATE(se.start_datetime)) as teaching_days,
        COUNT(DISTINCT se.academic_structure_id) as subjects_count
    FROM teachers t
    LEFT JOIN schedule_events se ON t.id = se.teacher_id 
        AND se.is_active = TRUE 
        AND se.deleted_at IS NULL
        AND (p_academic_period IS NULL OR se.academic_period = p_academic_period)
        AND (p_area_id IS NULL OR se.area_id = p_area_id)
    WHERE t.is_active = TRUE
      AND (p_teacher_id IS NULL OR t.id = p_teacher_id)
    GROUP BY t.id, t.first_name, t.last_name, t.department
    ORDER BY total_hours DESC;
    
    -- Estadísticas por día de la semana
    SELECT 
        day_of_week,
        COUNT(*) as events_count,
        SUM(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime) / 60.0) as total_hours,
        AVG(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime) / 60.0) as avg_hours,
        COUNT(DISTINCT teacher_id) as teachers_count,
        COUNT(DISTINCT classroom) as classrooms_count
    FROM schedule_events
    WHERE is_active = TRUE
      AND deleted_at IS NULL
      AND (p_academic_period IS NULL OR academic_period = p_academic_period)
      AND (p_area_id IS NULL OR area_id = p_area_id)
      AND (p_teacher_id IS NULL OR teacher_id = p_teacher_id)
    GROUP BY day_of_week
    ORDER BY 
        CASE day_of_week
            WHEN 'Lunes' THEN 1
            WHEN 'Martes' THEN 2
            WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4
            WHEN 'Viernes' THEN 5
            WHEN 'Sábado' THEN 6
            WHEN 'Domingo' THEN 7
            ELSE 8
        END;
    
    -- Top aulas más utilizadas
    SELECT 
        classroom,
        COUNT(*) as events_count,
        SUM(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime) / 60.0) as total_hours,
        COUNT(DISTINCT teacher_id) as different_teachers,
        COUNT(DISTINCT academic_structure_id) as different_subjects
    FROM schedule_events
    WHERE is_active = TRUE
      AND deleted_at IS NULL
      AND classroom IS NOT NULL
      AND (p_academic_period IS NULL OR academic_period = p_academic_period)
      AND (p_area_id IS NULL OR area_id = p_area_id)
      AND (p_teacher_id IS NULL OR teacher_id = p_teacher_id)
    GROUP BY classroom
    ORDER BY total_hours DESC
    LIMIT 10;

END$$

DELIMITER ;
