-- Migration: 019-create-sp-migrate-vacantes-inicio.sql
-- Descripción: Crear stored procedure para migrar datos de staging_vacantes_inicio a vacantes_inicio_permanente
-- Fecha: 2024

-- Mapeo:
-- staging_vacantes_inicio.codigo_plan -> vacantes_inicio_permanente.codigo_plan
-- staging_vacantes_inicio.carrera -> vacantes_inicio_permanente.carrera
-- staging_vacantes_inicio.sigla_asignatura -> vacantes_inicio_permanente.sigla_asignatura
-- staging_vacantes_inicio.asignatura -> vacantes_inicio_permanente.asignatura
-- staging_vacantes_inicio.nivel -> vacantes_inicio_permanente.nivel
-- staging_vacantes_inicio.creditos -> vacantes_inicio_permanente.creditos
-- staging_vacantes_inicio.vacantes -> vacantes_inicio_permanente.vacantes
-- staging_vacantes_inicio.id_bimestre -> vacantes_inicio_permanente.id_bimestre
-- Los campos de auditoría se establecen automáticamente

DROP PROCEDURE IF EXISTS sp_migrate_staging_vacantes_inicio_to_permanente;

DELIMITER //

CREATE PROCEDURE sp_migrate_staging_vacantes_inicio_to_permanente(
    IN p_aprobado_por VARCHAR(255)
)
BEGIN
    INSERT INTO vacantes_inicio_permanente (
        codigo_plan,
        carrera,
        sigla_asignatura,
        asignatura,
        nivel,
        creditos,
        vacantes,
        id_bimestre,
        fecha_aprobacion,
        aprobado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo
    )
    SELECT
        svi.codigo_plan,
        svi.carrera,
        svi.sigla_asignatura,
        svi.asignatura,
        svi.nivel,
        svi.creditos,
        svi.vacantes,
        svi.id_bimestre,
        NOW(), -- fecha_aprobacion
        COALESCE(p_aprobado_por, 'SISTEMA'), -- aprobado_por
        NOW(), -- fecha_creacion
        NOW(), -- fecha_actualizacion
        1 -- activo
    FROM
        staging_vacantes_inicio svi
    WHERE svi.codigo_plan IS NOT NULL 
      AND svi.codigo_plan != ''
      AND svi.sigla_asignatura IS NOT NULL 
      AND svi.sigla_asignatura != ''
      AND svi.carrera IS NOT NULL 
      AND svi.carrera != ''
      AND svi.asignatura IS NOT NULL 
      AND svi.asignatura != ''
      AND svi.id_bimestre IS NOT NULL
      AND svi.vacantes IS NOT NULL
      AND svi.creditos IS NOT NULL
    ON DUPLICATE KEY UPDATE
        carrera = VALUES(carrera),
        asignatura = VALUES(asignatura),
        nivel = VALUES(nivel),
        creditos = VALUES(creditos),
        vacantes = VALUES(vacantes),
        fecha_aprobacion = NOW(),
        aprobado_por = COALESCE(p_aprobado_por, 'SISTEMA'),
        fecha_actualizacion = NOW(),
        activo = 1;
END //

DELIMITER ;

-- Comentarios sobre el procedimiento:
-- 1. Valida que los campos obligatorios no sean nulos o vacíos
-- 2. Utiliza ON DUPLICATE KEY UPDATE para manejar registros existentes
-- 3. Establece automáticamente las fechas de auditoría y el estado activo
-- 4. Acepta el email del usuario que aprueba como parámetro
-- 5. Si no se proporciona aprobado_por, usa 'SISTEMA' por defecto

-- Para ejecutar el procedimiento:
-- CALL sp_migrate_staging_vacantes_inicio_to_permanente('usuario@ejemplo.com');
-- O sin parámetro (usará 'SISTEMA'):
-- CALL sp_migrate_staging_vacantes_inicio_to_permanente(NULL);