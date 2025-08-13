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
    IN p_parametro1 INT,
    IN p_parametro2 VARCHAR(50) 
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
    -- VALIDACIONES PARAMETROS
    -- ============================
  /*  IF p_parametro1 IS NOT NULL AND p_parametro1 <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El parametro1 debe ser mayor que 0';
    END IF;

    IF p_parametro2 IS NOT NULL AND LENGTH(p_parametro2) = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El parametro2 no puede estar vacío';
    END IF;
*/
    -- ============================
    -- CONSULTA PRINCIPAL
    -- ============================
    SELECT 
        usuario, 
        Nombre_asignatura, 
        SIGLA, 
        ID_Docente, 
        Docente, 
        Horas_a_pago, 
        NULL AS ID_Evento_1, 
        Fecha_evento_1, 
        Horas_Evento_1,
        NULL AS ID_Evento2, 
        Fecha_evento_2, 
        Horas_Evento2, 
        NULL AS Observaciones
    FROM Vw_Base_Reportes
--    WHERE (p_parametro1 IS NULL OR bimestre_id = p_parametro1)
--     AND (p_parametro2 IS NULL OR Codigo_Plan = p_parametro2)
    ORDER BY anno DESC, bimestre, SIGLA;

END$$

DELIMITER ;

-- =====================================================
-- SP_ReporteProgramacionAcademica
-- Genera el reporte de programación académica
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS SP_ReporteProgramacionAcademica$$
CREATE PROCEDURE SP_ReporteProgramacionAcademica(
    IN p_parametro1 INT,
    IN p_parametro2 VARCHAR(50)
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
    -- Validaciones de parametros
    -- ==========================
 /*   IF p_parametro1 IS NOT NULL AND p_parametro1 < 1 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El parámetro1 debe ser mayor a 0';
    END IF;

    IF p_parametro2 IS NOT NULL AND LENGTH(TRIM(p_parametro2)) = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El parámetro2 no puede estar vacío';
    END IF;
*/
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
    FROM Vw_Base_Reportes
--    WHERE (p_parametro1 IS NULL OR bimestre_id = p_parametro1)
--     AND (p_parametro2 IS NULL OR Codigo_Plan = p_parametro2)
    ORDER BY 
        anno DESC,
        bimestre DESC,
        Codigo_Plan,
        Nivel,
        SIGLA;

END$$

DELIMITER ;

