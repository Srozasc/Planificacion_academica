DROP PROCEDURE IF EXISTS sp_GetEventsByDateRange;

CREATE PROCEDURE sp_GetEventsByDateRange(
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_bimestre_id INT,
    IN p_active TINYINT
)
BEGIN
    SELECT
        e.id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.teacher,
        e.subject,
        e.room,
        e.students,
        e.background_color,
        e.bimestre_id,
        e.active,
        e.created_at,
        e.updated_at,
        b.nombre AS bimestre_nombre,
        b.anoAcademico AS bimestre_ano_academico
    FROM schedule_events e
    LEFT JOIN bimestres b ON e.bimestre_id = b.id
    WHERE
        (IFNULL(p_active, e.active) = e.active)
        AND (IFNULL(p_bimestre_id, e.bimestre_id) = e.bimestre_id)
        AND (
            (e.start_date BETWEEN p_start_date AND p_end_date)
            OR (e.end_date BETWEEN p_start_date AND p_end_date)
            OR (e.start_date <= p_start_date AND e.end_date >= p_end_date)
        )
    ORDER BY e.start_date;
END;