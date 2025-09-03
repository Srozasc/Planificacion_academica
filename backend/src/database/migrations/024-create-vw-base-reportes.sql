-- =============================================
-- Migración: Crear vista Vw_Base_Reportes
-- Archivo: 024-create-vw-base-reportes.sql
-- Fecha: 2025-01-30
-- Descripción: Crear vista para obtener datos para generación de reportes
-- =============================================

USE planificacion_academica;

-- =====================================================
-- VISTA: Vw_Base_Reportes
-- Vista para el obtener datos para generacion de reportes
-- =====================================================

DROP VIEW IF EXISTS vw_base_reportes;
CREATE VIEW vw_base_reportes AS
SELECT DISTINCT
        
    -- =====================================================
    -- INFORMACIÓN BASICA DE ASIGNATURA, CARRERA Y DOCENTE
    -- =====================================================
	se.bimestre_id,
    b.anoAcademico AS anno,
    b.numeroBimestre AS bimestre,
    b.fechaInicio AS fecha_inicio_bimestre,
    b.fechaFin AS fecha_fin_bimestre,
    se.usuario,
	se.plan AS Codigo_Plan,
    acs.name AS nombre_carrera,
    TRIM(SUBSTRING(se.title,LOCATE('-',se.title)+1,LOCATE('-',se.title, LOCATE('-',se.title)+1)-LOCATE('-',se.title)-1)) AS Nombre_asignatura,
    se.subject AS SIGLA,
	acs.level as Nivel,
    t.id_docente AS ID_Docente,
    t.name AS Docente,
	se.students as Cupos,
    right(se.title,3) as Seccion,
    da.sigla as Dol,
	'OBL'  AS OBL_OPT,
	 CASE 
		WHEN da.descripcion is null
		THEN TRIM(SUBSTRING_INDEX(se.title, '-', 2)) 
		ELSE CONCAT(da.sigla, '-', da.descripcion, '-', da.plan) 
	END AS Descripcion,
	CASE 
		WHEN se.horas IS NULL
		THEN COALESCE(acs.hours, 0) 
		ELSE COALESCE(se.horas, 0)
	END AS horas_Asignatura_Base,

    -- =====================================================
    -- CALCULO DE HORAS A PAGO (SUMA DE AMBOS EVENTOS)
    -- =====================================================
	ROUND(((CASE 
		WHEN se.horas is null 
		THEN ( -- Horas_Evento_1 + Horas_Evento_2
	         -- Horas_Evento_1
			 (COALESCE(acs.hours, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * 
			 (((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1) - DAYOFMONTH(b.fechaFin)) +
			 -- Horas evento 2
			 (COALESCE(acs.hours, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * DAYOFMONTH(b.fechaFin)) 
		ELSE
			( -- Horas_Evento_1 + Horas_Evento_2
	         -- Horas_Evento_1
			 (COALESCE(se.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * 
			 (((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1) - DAYOFMONTH(b.fechaFin)) +
			 -- Horas evento 2
			 (COALESCE(se.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * DAYOFMONTH(b.fechaFin)) 
	END) * (CASE WHEN SUBSTRING(se.subject, 1, 4) = 'ADOL' THEN 1 ELSE COALESCE(b.factor, 1) END)), 0) AS Horas_a_pago,
 
    -- =====================================================
    -- FECHA EVENTO 1 (fecha inicio y fin evento 1)
    -- =====================================================
    CONCAT(DATE_FORMAT(b.fechaInicio, '%d/%m/%Y'),' al ',DATE_FORMAT(LAST_DAY(DATE_SUB(b.fechaFin, INTERVAL 1 MONTH)),'%d/%m/%Y')
    ) AS Fecha_evento_1,
    
    -- =====================================================
    -- HORAS EVENTO 1 
    -- =====================================================
    ROUND(((CASE 
		WHEN se.horas IS NULL
		THEN
			(COALESCE(acs.hours, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * 
			(((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1) - DAYOFMONTH(b.fechaFin)) 
		ELSE
			(COALESCE(se.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * 
			(((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1) - DAYOFMONTH(b.fechaFin)) 
	END) * (CASE WHEN SUBSTRING(se.subject, 1, 4) = 'ADOL' THEN 1 ELSE COALESCE(b.factor, 1) END)), 0) AS Horas_Evento_1,
    
  
    -- =====================================================
    -- FECHA EVENTO 2
    -- =====================================================
    CONCAT(DATE_FORMAT(DATE_FORMAT(b.fechaFin, '%Y-%m-01'),'%d/%m/%Y'),' al ', DATE_FORMAT(b.fechaFin, '%d/%m/%Y')) AS Fecha_evento_2,
    
    -- =====================================================
    -- HORAS EVENTO 2 
    -- =====================================================
    ROUND(((CASE 
		WHEN se.horas IS NULL
		THEN
			(COALESCE(acs.hours, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * DAYOFMONTH(b.fechaFin) 
		ELSE 
			(COALESCE(se.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * DAYOFMONTH(b.fechaFin)
	END) * (CASE WHEN SUBSTRING(se.subject, 1, 4) = 'ADOL' THEN 1 ELSE COALESCE(b.factor, 1) END)), 0) AS Horas_Evento2
    
FROM schedule_events  se -- Universo de Asignaturas y Adol

-- =====================================================
-- JOINS PRINCIPALES
-- =====================================================
-- Bimestre
LEFT JOIN  bimestres b 
    ON b.id = se.bimestre_id

-- Estrucutra academica (para obtener las horas por asignatura)
LEFT JOIN academic_structures acs 
    ON acs.id_bimestre = se.bimestre_id
    AND acs.acronym = se.subject
    AND acs.code = se.plan

-- relación eventos-docentes
LEFT JOIN event_teachers et 
    ON et.event_id = se.id 
    AND et.id_bimestre = se.bimestre_id

-- Información del docente
LEFT JOIN teachers t 
    ON t.id = et.teacher_id 
    AND t.id_bimestre = se.bimestre_id

-- DOL asociado   
LEFT JOIN dol_aprobados da 
    ON da.plan = acs.code 
    AND da.id_bimestre = se.bimestre_id   

-- Asignatura Optativa u obligatoria
LEFT JOIN asignaturas_optativas_aprobadas apo 
    ON apo.id_bimestre = se.bimestre_id
    AND apo.asignatura = se.subject
    AND apo.plan = se.plan
WHERE apo.asignatura is NULL

UNION

SELECT DISTINCT
        
-- =====================================================
-- INFORMACIÓN BASICA DE ASIGNATURA, CARRERA Y DOCENTE
-- =====================================================
	se.bimestre_id,
    b.anoAcademico AS anno,
    b.numeroBimestre AS bimestre,
    b.fechaInicio AS fecha_inicio_bimestre,
    b.fechaFin AS fecha_fin_bimestre,
    se.usuario,
	apo.plan AS Codigo_Plan,
    apo.descripcion_plan AS nombre_carrera,
    TRIM(SUBSTRING(se.title,LOCATE('-',se.title)+1,LOCATE('-',se.title, LOCATE('-',se.title)+1)-LOCATE('-',se.title)-1)) AS Nombre_asignatura,
    se.subject AS SIGLA,
	apo.nivel as Nivel,
    t.id_docente AS ID_Docente,
    t.name AS Docente,
	se.students as Cupos,
    right(se.title,3) as Seccion,
    da.sigla as Dol,
	'OPT'  AS OBL_OPT,
	CASE 
		WHEN da.descripcion is null
		THEN TRIM(SUBSTRING_INDEX(se.title, '-', 2)) 
		ELSE CONCAT(da.sigla, '-', da.descripcion, '-', da.plan) 
	END AS Descripcion,
	COALESCE(apo.horas, 0) AS horas_Asignatura_Base,
    -- =====================================================
    -- CALCULO DE HORAS A PAGO (SUMA DE AMBOS EVENTOS)
    -- =====================================================
	ROUND((( -- Horas_Evento_1 + Horas_Evento_2
	         -- Horas_Evento_1
			 (COALESCE(apo.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * 
			 (((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1) - DAYOFMONTH(b.fechaFin)) +
			 -- Horas evento 2
			 (COALESCE(apo.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * DAYOFMONTH(b.fechaFin)) * (CASE WHEN SUBSTRING(se.subject, 1, 4) = 'ADOL' THEN 1 ELSE COALESCE(b.factor, 1) END)), 0) AS Horas_a_pago,
 
    -- =====================================================
    -- FECHA EVENTO 1 (fecha inicio y fin evento 1)
    -- =====================================================
    CONCAT(DATE_FORMAT(b.fechaInicio, '%d/%m/%Y'),' al ',DATE_FORMAT(LAST_DAY(DATE_SUB(b.fechaFin, INTERVAL 1 MONTH)),'%d/%m/%Y')
    ) AS Fecha_evento_1,
    
    -- =====================================================
    -- HORAS EVENTO 1 
    -- =====================================================
    ROUND(((COALESCE(apo.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * 
			(((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1) - DAYOFMONTH(b.fechaFin))) * (CASE WHEN SUBSTRING(se.subject, 1, 4) = 'ADOL' THEN 1 ELSE COALESCE(b.factor, 1) END), 0) AS Horas_Evento_1,

    -- =====================================================
    -- FECHA EVENTO 2
    -- =====================================================
    CONCAT(DATE_FORMAT(DATE_FORMAT(b.fechaFin, '%Y-%m-01'),'%d/%m/%Y'),' al ', DATE_FORMAT(b.fechaFin, '%d/%m/%Y')) AS Fecha_evento_2,
    
    -- =====================================================
    -- HORAS EVENTO 2 
    -- =====================================================
    ROUND(((COALESCE(apo.horas, 0) / ((TO_DAYS(b.fechaFin) - TO_DAYS(b.fechaInicio)) + 1)) * DAYOFMONTH(b.fechaFin)) * (CASE WHEN SUBSTRING(se.subject, 1, 4) = 'ADOL' THEN 1 ELSE COALESCE(b.factor, 1) END), 0) AS Horas_Evento2

FROM schedule_events  se -- Universo de Asignaturas y Adol

-- =====================================================
-- JOINS PRINCIPALES
-- =====================================================
-- Bimestre
LEFT JOIN  bimestres b 
    ON b.id = se.bimestre_id

-- Asignatura Optativa u obligatoria
LEFT JOIN asignaturas_optativas_aprobadas apo 
    ON apo.id_bimestre = se.bimestre_id
    AND apo.asignatura = se.subject

-- relación eventos-docentes
LEFT JOIN event_teachers et 
    ON et.event_id = se.id 
    AND et.id_bimestre = se.bimestre_id

-- Información del docente
LEFT JOIN teachers t 
    ON t.id = et.teacher_id 
    AND t.id_bimestre = se.bimestre_id

-- DOL asociado   
LEFT JOIN dol_aprobados da 
    ON da.plan = apo.plan 
    AND da.id_bimestre = se.bimestre_id   

WHERE apo.asignatura IS NOT NULL
;