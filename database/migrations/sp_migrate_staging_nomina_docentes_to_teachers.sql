-- Stored Procedure para migrar datos de staging_nomina_docentes a teachers
-- Mapeo:
-- staging_nomina_docentes.docente -> teachers.name
-- staging_nomina_docentes.id_docente -> teachers.id_docente
-- staging_nomina_docentes.rut_docente -> teachers.rut
-- staging_nomina_docentes.id_bimestre -> teachers.id_bimestre
-- Los demás campos de teachers tendrán valores por defecto

DROP PROCEDURE IF EXISTS sp_migrate_staging_nomina_docentes_to_teachers;

DELIMITER //

CREATE PROCEDURE sp_migrate_staging_nomina_docentes_to_teachers()
BEGIN
    INSERT INTO teachers (
        name,
        id_docente,
        rut,
        id_bimestre,
        email,
        category_id,
        contract_type_id,
        is_active,
        can_coordinate,
        max_hours_per_week,
        created_at,
        updated_at
    )
    SELECT
        snd.docente,
        snd.id_docente,
        snd.rut_docente,
        snd.id_bimestre,
        CONCAT(LOWER(REPLACE(REPLACE(REPLACE(snd.docente, ' ', '.'), 'ñ', 'n'), 'á', 'a')), '@institucion.cl'), -- email generado automáticamente
        1, -- category_id (valor por defecto)
        1, -- contract_type_id (valor por defecto)
        1, -- is_active
        0, -- can_coordinate
        44, -- max_hours_per_week
        NOW(), -- created_at
        NOW() -- updated_at
    FROM
        staging_nomina_docentes snd
    WHERE snd.docente IS NOT NULL 
      AND snd.docente != ''
      AND snd.rut_docente IS NOT NULL 
      AND snd.rut_docente != ''
      AND snd.id_docente IS NOT NULL
      AND snd.id_bimestre IS NOT NULL
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        id_docente = VALUES(id_docente),
        rut = VALUES(rut),
        id_bimestre = VALUES(id_bimestre),
        email = VALUES(email),
        updated_at = NOW();
END //

DELIMITER ;

-- Comentarios sobre el procedimiento:
-- 1. Valida que los campos obligatorios (docente, rut_docente, id_docente, id_bimestre) no sean nulos o vacíos
-- 2. Genera un email automático basado en el nombre del docente (formato: nombre.apellido@institucion.cl)
-- 3. Establece valores por defecto para category_id (1) y contract_type_id (1)
-- 4. Utiliza ON DUPLICATE KEY UPDATE para manejar registros existentes
-- 5. Actualiza todos los campos mapeados incluyendo el email generado
-- 6. El campo email es obligatorio (NOT NULL) según la nueva estructura de la tabla

-- Para ejecutar el procedimiento:
-- CALL sp_migrate_staging_nomina_docentes_to_teachers();