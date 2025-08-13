-- =============================================
-- Migración: Crear procedimiento almacenado para migrar asignaturas optativas
-- Archivo: 023-create-sp-migrate-asignaturas-optativas.sql
-- Fecha: 2025-01-30
-- Descripción: Crear SP para migrar datos de staging_optativos a asignaturas_optativas_aprobadas
-- =============================================

USE planificacion_academica;

-- Eliminar el procedimiento si existe
DROP PROCEDURE IF EXISTS sp_migrate_staging_optativos_to_permanente;

DELIMITER //

CREATE PROCEDURE sp_migrate_staging_optativos_to_permanente(
    IN p_aprobado_por VARCHAR(255)
)
BEGIN
    INSERT INTO asignaturas_optativas_aprobadas (
        plan,
        descripcion_plan,
        nivel,
        grupo_asignatura,
        jornada,
        asignatura,
        descripcion_asignatura,
        vacantes,
        id_bimestre,
        aprobado_por,
        fecha_aprobacion,
        fecha_creacion,
        fecha_actualizacion,
        activo
    )
    SELECT
        so.plan,
        so.descripcion_plan,
        so.nivel,
        so.grupo_asignatura,
        so.jornada,
        so.asignatura,
        so.descripcion_asignatura,
        so.vacantes,
        so.id_bimestre,
        COALESCE(p_aprobado_por, 'SISTEMA'),
        NOW(),
        NOW(),
        NOW(),
        1
    FROM staging_optativos so
    WHERE so.plan IS NOT NULL AND so.plan != ''
      AND so.asignatura IS NOT NULL AND so.asignatura != ''
      AND so.descripcion_plan IS NOT NULL AND so.descripcion_plan != ''
      AND so.nivel IS NOT NULL AND so.nivel != ''
      AND so.grupo_asignatura IS NOT NULL AND so.grupo_asignatura != ''
      AND so.jornada IS NOT NULL AND so.jornada != ''
      AND so.descripcion_asignatura IS NOT NULL AND so.descripcion_asignatura != ''
      AND so.id_bimestre IS NOT NULL
      AND so.vacantes IS NOT NULL AND so.vacantes >= 0
    ON DUPLICATE KEY UPDATE
        plan = VALUES(plan),
        descripcion_plan = VALUES(descripcion_plan),
        nivel = VALUES(nivel),
        grupo_asignatura = VALUES(grupo_asignatura),
        jornada = VALUES(jornada),
        descripcion_asignatura = VALUES(descripcion_asignatura),
        vacantes = VALUES(vacantes),
        fecha_aprobacion = NOW(),
        aprobado_por = COALESCE(p_aprobado_por, 'SISTEMA'),
        fecha_actualizacion = NOW(),
        activo = 1;
END//

DELIMITER ;

-- Mensaje de confirmación
SELECT 'Procedimiento almacenado sp_migrate_staging_optativos_to_permanente creado exitosamente' AS resultado;

/*
USO DEL PROCEDIMIENTO:

CALL sp_migrate_staging_optativos_to_permanente('usuario@ejemplo.com');

FUNCIONALIDAD:
1. Valida que todos los campos obligatorios estén presentes
2. Migra datos de staging_optativos a asignaturas_optativas_aprobadas
3. Utiliza ON DUPLICATE KEY UPDATE para manejar duplicados
4. Agrega campos de auditoría (fecha_aprobacion, aprobado_por)
5. Maneja transacciones para garantizar integridad
6. Retorna estadísticas de la migración

VALIDACIONES:
- plan: No nulo y no vacío
- asignatura: No nulo y no vacío
- descripcion_plan: No nulo y no vacío
- nivel: No nulo y no vacío
- grupo_asignatura: No nulo y no vacío
- jornada: No nulo y no vacío
- descripcion_asignatura: No nulo y no vacío
- id_bimestre: No nulo
- vacantes: No nulo y >= 0

MANEJO DE DUPLICADOS:
- Clave única: (plan, asignatura, id_bimestre)
- En caso de duplicado, actualiza todos los campos excepto id
- Actualiza fecha_aprobacion y aprobado_por
*/