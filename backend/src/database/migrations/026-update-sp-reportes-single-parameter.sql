-- =============================================
-- Migración: Actualizar procedimientos almacenados de reportes para un solo parámetro
-- Archivo: 026-update-sp-reportes-single-parameter.sql
-- Fecha: 2025-01-18
-- Descripción: Modificar SP para que solo reciban el ID del bimestre como parámetro
-- =============================================

USE planificacion_academica;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS PARA REPORTES 
-- =====================================================

-- =====================================================
-- SP_ReporteProgramacionPagos
-- Genera el reporte de programación de pagos
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS SP_ReporteProgramacionPagos$$
CREATE PROCEDURE SP_ReporteProgramacionPagos(
    IN p_bimestre_id INT
 )
BEGIN
    -- Variables para manejo de errores
    DECLARE v_error_message TEXT;

    -- Handler para errores SQL
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Mensaje de error
        SELECT 'ERROR' AS status, 'Se produjo un error al ejecutar el procedimiento.' AS mensaje;
    END;

    -- ============================
    -- CONSULTA PRINCIPAL
    -- ============================
    SELECT 
        usuario, 
        Nombre_asignatura, 
        SIGLA, 
        ID_Docente, 
        Docente, 
        SUM(Horas_a_pago) as Horas_a_pago, 
        NULL AS ID_Evento_1, 
        Fecha_evento_1, 
        SUM(Horas_Evento_1) as Horas_Evento_1,
        NULL AS ID_Evento_2, 
        Fecha_evento_2, 
        SUM(Horas_Evento2) as Horas_Evento2, 
        NULL AS Observaciones
    FROM 
		Vw_Base_Reportes
    WHERE 
		bimestre_id = p_bimestre_id
	
	GROUP BY usuario, Nombre_asignatura, SIGLA, ID_Docente, Docente, Fecha_evento_1, Fecha_evento_2 
    ORDER BY usuario
	;

END$$

DELIMITER ;

-- =====================================================
-- SP_ReporteProgramacionAcademica
-- Genera el reporte de programación académica
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS SP_ReporteProgramacionAcademica$$
CREATE PROCEDURE SP_ReporteProgramacionAcademica(
    IN p_bimestre_id INT
)
BEGIN
    DECLARE v_total_registros INT DEFAULT 0;

    -- Manejo de errores 
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 
            'ERROR' AS status,
            'Se produjo un error inesperado en la ejecucion del procedimiento.' AS mensaje;
    END;

    -- ==========================
    -- Consulta 
    -- ==========================
    SELECT 
        anno AS Año,
        bimestre AS Bim,
        usuario,
        Codigo_Plan AS Plan,
        nombre_carrera AS Nombre_Plan,
        SIGLA AS Asignatura,
        Nombre_asignatura AS Nombre_Asignatura,
        Seccion,
        OBL_OPT AS Obli_Opt,
        Cupos,
        Nivel AS Nivel,
        horas_Asignatura_Base AS Horas_Asig,
        Dol,
        Horas_a_pago AS Horas_a_Pago,
        ID_Docente AS ID_Docente,
        Docente AS Docente,
        NULL AS Tipo_Docente,
        NULL AS Habilitado,
        NULL AS Observación
    FROM 
		Vw_Base_Reportes
    WHERE 
		bimestre_id = p_bimestre_id
    ORDER BY 
        anno DESC, bimestre DESC, Codigo_Plan, Nivel, SIGLA;

END$$

DELIMITER ;

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================

-- Verificar que los procedimientos fueron creados correctamente
SELECT 
    ROUTINE_NAME as 'Procedimiento',
    ROUTINE_TYPE as 'Tipo',
    CREATED as 'Fecha_Creacion',
    LAST_ALTERED as 'Ultima_Modificacion'
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'planificacion_academica' 
AND ROUTINE_NAME IN ('SP_ReporteProgramacionPagos', 'SP_ReporteProgramacionAcademica')
ORDER BY ROUTINE_NAME;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

SELECT 'Migración 026: Procedimientos almacenados de reportes actualizados para un solo parámetro' as resultado;