DELIMITER //

CREATE PROCEDURE sp_MigrateStagingToAcademicStructures()
BEGIN
    INSERT INTO academic_structures (
        code,
        name,
        level,
        acronym,
        course,
        credits,
        category,
        hours,
        duration,
        clplestud,
        school_code,
        school_prog,
        id_bimestre,
        is_active,
        created_at,
        updated_at
    )
    SELECT
        sea.plan,
        sea.carrera,
        sea.nivel,
        sea.sigla,
        sea.asignatura,
        sea.creditos,
        sea.categoria,
        sea.horas,
        sea.duracion_carrera,
        sea.clplestud,
        sea.codigo_escuela,
        sea.escuela_programa,
        sea.id_bimestre,
        1, -- is_active
        NOW(), -- created_at
        NOW() -- updated_at
    FROM
        staging_estructura_academica sea
    ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        name = VALUES(name),
        level = VALUES(level),
        course = VALUES(course),
        credits = VALUES(credits),
        category = VALUES(category),
        hours = VALUES(hours),
        duration = VALUES(duration),
        clplestud = VALUES(clplestud),
        school_code = VALUES(school_code),
        school_prog = VALUES(school_prog),
        is_active = 1,
        updated_at = NOW();
END //

DELIMITER ;