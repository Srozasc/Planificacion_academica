-- =====================================================
-- VISTA: Vw_Base_Reportes
-- Vista para el obtener datos para generacion de reportes
-- =====================================================

DROP VIEW IF EXISTS Vw_Base_Reportes;
CREATE VIEW Vw_Base_Reportes AS
SELECT DISTINCT
        
    -- =====================================================
    -- INFORMACIÓN BASICA DE ASIGNATURA, CARRERA Y DOCENTE
    -- =====================================================
	se.bimestre_id,
    b.anoAcademico AS anno,
    b.numeroBimestre AS bimestre,
    b.fechaInicio AS fecha_inicio_bimestre,
    b.fechaFin AS fecha_fin_bimestre,
    se.usuario COLLATE utf8mb4_unicode_ci,
	acs.code COLLATE utf8mb4_unicode_ci AS Codigo_Plan,
    acs.name COLLATE utf8mb4_unicode_ci AS nombre_carrera,
    TRIM(SUBSTRING(se.title,LOCATE('-',se.title)+1,LOCATE('-',se.title, LOCATE('-',se.title)+1)-LOCATE('-',se.title)-1)) COLLATE utf8mb4_unicode_ci AS Nombre_asignatura,
    se.subject COLLATE utf8mb4_unicode_ci AS SIGLA,
	acs.level as Nivel,
    t.id_docente AS ID_Docente,
    t.name COLLATE utf8mb4_unicode_ci AS Docente,
	se.students as Cupos,
    right(se.title,3) COLLATE utf8mb4_unicode_ci as Seccion,
    da.sigla COLLATE utf8mb4_unicode_ci as Dol,
	'OBL' COLLATE utf8mb4_unicode_ci AS OBL_OPT,
	CASE 
		WHEN se.horas IS NULL
		THEN COALESCE(acs.hours, 0) 
		ELSE COALESCE(se.horas, 0)
	END AS horas_Asignatura_Base,

    -- =====================================================
    -- CALCULO DE HORAS A PAGO (SUMA DE AMBOS EVENTOS)
    -- =====================================================
	(CASE 
		WHEN se.horas is null 
		THEN ROUND( -- Horas_Evento_1 + Horas_Evento_2
	         -- Horas_Evento_1
			 (COALESCE(acs.hours, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * 
			 ((DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin)) +
			 -- Horas evento 2
			 (COALESCE(acs.hours, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * DAY(b.fechaFin), 2) 
		ELSE
			ROUND( -- Horas_Evento_1 + Horas_Evento_2
	         -- Horas_Evento_1
			 (COALESCE(se.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * 
			 ((DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin)) +
			 -- Horas evento 2
			 (COALESCE(se.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * DAY(b.fechaFin), 2) 
	END) * COALESCE(b.factor,1) 	AS Horas_a_pago,
 
    -- =====================================================
    -- FECHA EVENTO 1 (fecha inicio y fin evento 1)
    -- =====================================================
    CONCAT(DATE_FORMAT(b.fechaInicio, '%d/%m/%Y'),' al ',DATE_FORMAT(LAST_DAY(DATE_SUB(b.fechaFin, INTERVAL 1 MONTH)),'%d/%m/%Y')
    ) COLLATE utf8mb4_unicode_ci AS Fecha_evento_1,
    
    -- =====================================================
    -- HORAS EVENTO 1 
    -- =====================================================
    (CASE 
		WHEN se.horas IS NULL
		THEN
			ROUND((COALESCE(acs.hours, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * 
			((DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin)), 2) 
		ELSE
			ROUND((COALESCE(se.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * 
			((DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin)), 2) 
	END) * COALESCE(b.factor,1)  AS Horas_Evento_1,
    
  
    -- =====================================================
    -- FECHA EVENTO 2
    -- =====================================================
    CONCAT(DATE_FORMAT(DATE_FORMAT(b.fechaFin, '%Y-%m-01'),'%d/%m/%Y'),' al ', DATE_FORMAT(b.fechaFin, '%d/%m/%Y')) COLLATE utf8mb4_unicode_ci AS Fecha_evento_2,
    
    -- =====================================================
    -- HORAS EVENTO 2 
    -- =====================================================
    (CASE 
		WHEN se.horas IS NULL
		THEN
			ROUND((COALESCE(acs.hours, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * DAY(b.fechaFin), 2) 
		ELSE 
			ROUND((COALESCE(se.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * DAY(b.fechaFin), 2)
	END)* COALESCE(b.factor,1) 	AS Horas_Evento2,
    
    -- Campos de verificacion de calculos
	COALESCE(b.factor,1) ,
    DATEDIFF(b.fechaFin, b.fechaInicio) + 1 AS cantidad_total_dias,
    DAY(b.fechaFin) AS dias_evento_2,
    (DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin) AS dias_evento_1
    
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
    se.usuario COLLATE utf8mb4_unicode_ci,
	apo.plan COLLATE utf8mb4_unicode_ci AS Codigo_Plan,
    apo.descripcion_plan COLLATE utf8mb4_unicode_ci AS nombre_carrera,
    TRIM(SUBSTRING(se.title,LOCATE('-',se.title)+1,LOCATE('-',se.title, LOCATE('-',se.title)+1)-LOCATE('-',se.title)-1)) COLLATE utf8mb4_unicode_ci AS Nombre_asignatura,
    se.subject COLLATE utf8mb4_unicode_ci AS SIGLA,
	apo.nivel as Nivel,
    t.id_docente AS ID_Docente,
    t.name COLLATE utf8mb4_unicode_ci AS Docente,
	se.students as Cupos,
    right(se.title,3) COLLATE utf8mb4_unicode_ci as Seccion,
    da.sigla COLLATE utf8mb4_unicode_ci as Dol,
	'OPT' COLLATE utf8mb4_unicode_ci AS OBL_OPT,
	COALESCE(apo.horas, 0) AS horas_Asignatura_Base,
    -- =====================================================
    -- CALCULO DE HORAS A PAGO (SUMA DE AMBOS EVENTOS)
    -- =====================================================
	(ROUND( -- Horas_Evento_1 + Horas_Evento_2
	         -- Horas_Evento_1
			 (COALESCE(apo.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * 
			 ((DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin)) +
			 -- Horas evento 2
			 (COALESCE(apo.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * DAY(b.fechaFin), 2) * COALESCE(b.factor,1) ) 	AS Horas_a_pago,
 
    -- =====================================================
    -- FECHA EVENTO 1 (fecha inicio y fin evento 1)
    -- =====================================================
    CONCAT(DATE_FORMAT(b.fechaInicio, '%d/%m/%Y'),' al ',DATE_FORMAT(LAST_DAY(DATE_SUB(b.fechaFin, INTERVAL 1 MONTH)),'%d/%m/%Y')
    ) COLLATE utf8mb4_unicode_ci AS Fecha_evento_1,
    
    -- =====================================================
    -- HORAS EVENTO 1 
    -- =====================================================
    (ROUND((COALESCE(apo.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * 
			((DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin)), 2) * COALESCE(b.factor,1) ) AS Horas_Evento_1,

    -- =====================================================
    -- FECHA EVENTO 2
    -- =====================================================
    CONCAT(DATE_FORMAT(DATE_FORMAT(b.fechaFin, '%Y-%m-01'),'%d/%m/%Y'),' al ', DATE_FORMAT(b.fechaFin, '%d/%m/%Y')) COLLATE utf8mb4_unicode_ci AS Fecha_evento_2,
    
    -- =====================================================
    -- HORAS EVENTO 2 
    -- =====================================================
    (ROUND((COALESCE(apo.horas, 0) / (DATEDIFF(b.fechaFin, b.fechaInicio) + 1)) * DAY(b.fechaFin), 2) * COALESCE(b.factor,1) ) AS Horas_Evento2,
    
    -- Campos de verificacion de calculos
	COALESCE(b.factor,1) ,
    DATEDIFF(b.fechaFin, b.fechaInicio) + 1 AS cantidad_total_dias,
    DAY(b.fechaFin) AS dias_evento_2,
    (DATEDIFF(b.fechaFin, b.fechaInicio) + 1) - DAY(b.fechaFin) AS dias_evento_1

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
  
 
 