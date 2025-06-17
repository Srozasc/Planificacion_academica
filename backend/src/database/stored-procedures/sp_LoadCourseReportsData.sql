-- =====================================================
-- Stored Procedure: sp_LoadCourseReportsData
-- Descripción: Procesa JSON de reportes de cursables
-- Valida integridad referencial con academic_structures y validaciones estadísticas
-- Autor: Sistema de Planificación Académica
-- Fecha: 2025-06-16
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_LoadCourseReportsData$$

CREATE PROCEDURE sp_LoadCourseReportsData(
    IN p_json_data LONGTEXT,
    IN p_user_id INT,
    IN p_update_mode VARCHAR(20),
    OUT p_result_json LONGTEXT
)
proc_main: BEGIN
    -- Variables de control
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_success_count INT DEFAULT 0;
    DECLARE v_update_count INT DEFAULT 0;
    DECLARE v_insert_count INT DEFAULT 0;
    DECLARE v_skip_count INT DEFAULT 0;
    
    -- Variables para procesamiento de cada registro
    DECLARE v_row_index INT DEFAULT 0;
    DECLARE v_academic_structure_id INT;
    DECLARE v_student_count INT;
    DECLARE v_term VARCHAR(20);
    DECLARE v_year YEAR;
    DECLARE v_section VARCHAR(10);
    DECLARE v_modality VARCHAR(20);
    DECLARE v_enrolled_count INT;
    DECLARE v_passed_count INT;
    DECLARE v_failed_count INT;
    DECLARE v_withdrawn_count INT;
    DECLARE v_weekly_hours DECIMAL(4,2);
    DECLARE v_total_hours DECIMAL(6,2);
    DECLARE v_is_validated BOOLEAN;
    DECLARE v_notes TEXT;
    
    -- Variables de validación
    DECLARE v_existing_id INT DEFAULT NULL;
    DECLARE v_academic_structure_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;
    
    -- Variables para manejo de errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Error SQL durante el procesamiento',
            'error_code', @errno,
            'error_message', @text,
            'processed_rows', v_row_index
        );
    END;
    
    -- Tabla temporal para almacenar errores de validación
    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;
    CREATE TEMPORARY TABLE temp_validation_errors (
        row_index INT,
        field_name VARCHAR(50),
        error_type VARCHAR(50),
        error_message TEXT,
        record_data JSON
    );
    
    -- Iniciar transacción
    START TRANSACTION;
    
    -- Establecer valor default para p_update_mode si es NULL
    IF p_update_mode IS NULL OR p_update_mode = '' THEN
        SET p_update_mode = 'UPSERT';
    END IF;
    
    -- Validar que el JSON de entrada es válido
    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'JSON de entrada inválido o vacío'
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Validar parámetro de modo de actualización
    IF p_update_mode NOT IN ('INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT') THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Modo de actualización inválido. Debe ser: INSERT_ONLY, UPDATE_ONLY o UPSERT'
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('Usuario con ID ', p_user_id, ' no encontrado')
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Procesamiento principal
    BEGIN
        -- Obtener el número de elementos en el array JSON
        SET @array_length = JSON_LENGTH(p_json_data);
        
        -- Procesar cada elemento del array JSON
        WHILE v_row_index < @array_length DO
            -- Obtener el registro actual
            SET @current_record = JSON_EXTRACT(p_json_data, CONCAT('$[', v_row_index, ']'));
            
            -- Reiniciar variables de validación
            SET v_validation_passed = TRUE;
            SET v_academic_structure_exists = FALSE;            -- Extraer campos del JSON (con manejo correcto de NULL)
            SET v_academic_structure_id = JSON_EXTRACT(@current_record, '$.academic_structure_id');
            SET v_student_count = COALESCE(JSON_EXTRACT(@current_record, '$.student_count'), 0);
            SET v_term = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.term'));
            SET v_year = JSON_EXTRACT(@current_record, '$.year');
            SET v_section = IF(JSON_EXTRACT(@current_record, '$.section') IS NULL, NULL, JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.section')));
            SET v_modality = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.modality')), 'presencial');
            SET v_enrolled_count = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.enrolled_count') = CAST('null' AS JSON) THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.enrolled_count') 
            END;
            SET v_passed_count = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.passed_count') = CAST('null' AS JSON) THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.passed_count') 
            END;
            SET v_failed_count = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.failed_count') = CAST('null' AS JSON) THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.failed_count') 
            END;
            SET v_withdrawn_count = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.withdrawn_count') = CAST('null' AS JSON) THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.withdrawn_count') 
            END;
            SET v_weekly_hours = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.weekly_hours') = CAST('null' AS JSON) THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.weekly_hours') 
            END;
            SET v_total_hours = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.total_hours') = CAST('null' AS JSON) THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.total_hours') 
            END;
            SET v_is_validated = COALESCE(JSON_EXTRACT(@current_record, '$.is_validated'), FALSE);
            SET v_notes = IF(JSON_EXTRACT(@current_record, '$.notes') IS NULL, NULL, JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.notes')));
            
            -- ===== VALIDACIONES =====
            
            -- 1. Validar campos requeridos
            IF v_academic_structure_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'academic_structure_id', 'REQUIRED', 'El ID de estructura académica es requerido', @current_record
                );
            END IF;
            
            IF v_term IS NULL OR v_term = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'term', 'REQUIRED', 'El período/semestre es requerido', @current_record
                );
            END IF;
            
            IF v_year IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'year', 'REQUIRED', 'El año académico es requerido', @current_record
                );
            END IF;
            
            -- 2. Validar integridad referencial con academic_structures
            IF v_academic_structure_id IS NOT NULL THEN
                SELECT COUNT(*) > 0 INTO v_academic_structure_exists
                FROM academic_structures 
                WHERE id = v_academic_structure_id AND deleted_at IS NULL;
                
                IF NOT v_academic_structure_exists THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (
                        v_row_index, 'academic_structure_id', 'FOREIGN_KEY', 
                        CONCAT('Estructura académica con ID ', v_academic_structure_id, ' no encontrada'), @current_record
                    );
                END IF;
            END IF;
            
            -- 3. Validar enums
            IF v_term IS NOT NULL AND v_term NOT IN ('1', '2', 'anual', 'intensivo') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'term', 'ENUM', 'El período debe ser: 1, 2, anual o intensivo', @current_record
                );
            END IF;
            
            IF v_modality IS NOT NULL AND v_modality NOT IN ('presencial', 'online', 'mixta') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'modality', 'ENUM', 'La modalidad debe ser: presencial, online o mixta', @current_record
                );
            END IF;
            
            -- 4. Validar rangos numéricos
            IF v_student_count IS NOT NULL AND v_student_count < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'student_count', 'RANGE', 'La cantidad de estudiantes debe ser mayor o igual a 0', @current_record
                );
            END IF;
            
            IF v_year IS NOT NULL AND (v_year < 2020 OR v_year > 2050) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'year', 'RANGE', 'El año debe estar entre 2020 y 2050', @current_record
                );
            END IF;
            
            IF v_enrolled_count IS NOT NULL AND v_enrolled_count < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'enrolled_count', 'RANGE', 'Los estudiantes matriculados deben ser mayor o igual a 0', @current_record
                );
            END IF;
            
            IF v_passed_count IS NOT NULL AND v_passed_count < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'passed_count', 'RANGE', 'Los estudiantes aprobados deben ser mayor o igual a 0', @current_record
                );
            END IF;
            
            IF v_failed_count IS NOT NULL AND v_failed_count < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'failed_count', 'RANGE', 'Los estudiantes reprobados deben ser mayor o igual a 0', @current_record
                );
            END IF;
            
            IF v_withdrawn_count IS NOT NULL AND v_withdrawn_count < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'withdrawn_count', 'RANGE', 'Los estudiantes retirados deben ser mayor o igual a 0', @current_record
                );
            END IF;
            
            IF v_weekly_hours IS NOT NULL AND v_weekly_hours <= 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'weekly_hours', 'RANGE', 'Las horas semanales deben ser mayor a 0', @current_record
                );
            END IF;
            
            IF v_total_hours IS NOT NULL AND v_total_hours <= 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'total_hours', 'RANGE', 'Las horas totales deben ser mayor a 0', @current_record
                );
            END IF;
            
            -- 5. Validar longitudes de campos
            IF v_section IS NOT NULL AND LENGTH(v_section) > 10 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'section', 'FORMAT', 'La sección no puede exceder 10 caracteres', @current_record
                );
            END IF;
            
            -- 6. Validar consistencia de datos estadísticos
            IF v_enrolled_count IS NOT NULL AND 
               (v_passed_count IS NOT NULL OR v_failed_count IS NOT NULL OR v_withdrawn_count IS NOT NULL) THEN
                
                SET @total_accounted = COALESCE(v_passed_count, 0) + COALESCE(v_failed_count, 0) + COALESCE(v_withdrawn_count, 0);
                
                IF @total_accounted > v_enrolled_count THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (
                        v_row_index, 'enrolled_count', 'LOGIC', 
                        CONCAT('El total de estudiantes contabilizados (', @total_accounted, ') excede los matriculados (', v_enrolled_count, ')'), @current_record
                    );
                END IF;
            END IF;
            
            -- 7. Validar duplicados según el modo de operación
            -- La clave única es: academic_structure_id, year, term, section
            SELECT id INTO v_existing_id
            FROM course_reports_data 
            WHERE academic_structure_id = v_academic_structure_id 
              AND year = v_year 
              AND term = v_term 
              AND (
                  (section IS NULL AND v_section IS NULL) OR 
                  (section = v_section)
              )
              AND deleted_at IS NULL
            LIMIT 1;
            
            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'duplicate', 'DUPLICATE', 
                    CONCAT('Ya existe un reporte para la estructura ', v_academic_structure_id, ', año ', v_year, ', período ', v_term, ', sección ', COALESCE(v_section, 'NULL'), ' (modo INSERT_ONLY)'), @current_record
                );
            END IF;
            
            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'not_found', 'NOT_FOUND', 
                    CONCAT('No existe un reporte para actualizar con estructura ', v_academic_structure_id, ', año ', v_year, ', período ', v_term, ', sección ', COALESCE(v_section, 'NULL'), ' (modo UPDATE_ONLY)'), @current_record
                );
            END IF;
            
            -- ===== PROCESAMIENTO =====
            
            IF v_validation_passed THEN
                -- Limpiar campos vacíos
                IF v_section = '' THEN SET v_section = NULL; END IF;
                IF v_notes = '' THEN SET v_notes = NULL; END IF;
                
                -- Determinar operación: INSERT o UPDATE
                IF v_existing_id IS NULL THEN
                    -- INSERT
                    INSERT INTO course_reports_data (
                        academic_structure_id, student_count, term, year, section, modality,
                        enrolled_count, passed_count, failed_count, withdrawn_count,
                        weekly_hours, total_hours, is_validated, notes
                    ) VALUES (
                        v_academic_structure_id, v_student_count, v_term, v_year, v_section, v_modality,
                        v_enrolled_count, v_passed_count, v_failed_count, v_withdrawn_count,
                        v_weekly_hours, v_total_hours, v_is_validated, v_notes
                    );
                    
                    SET v_insert_count = v_insert_count + 1;
                    SET v_success_count = v_success_count + 1;
                ELSE
                    -- UPDATE
                    UPDATE course_reports_data SET
                        student_count = v_student_count,
                        modality = v_modality,
                        enrolled_count = v_enrolled_count,
                        passed_count = v_passed_count,
                        failed_count = v_failed_count,
                        withdrawn_count = v_withdrawn_count,
                        weekly_hours = v_weekly_hours,
                        total_hours = v_total_hours,
                        is_validated = v_is_validated,
                        notes = v_notes,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = v_existing_id;
                    
                    SET v_update_count = v_update_count + 1;
                    SET v_success_count = v_success_count + 1;
                END IF;
            ELSE
                SET v_error_count = v_error_count + 1;
            END IF;
            
            SET v_row_index = v_row_index + 1;
        END WHILE;
        
        -- Preparar resultado
        IF v_error_count > 0 THEN
            -- Si hay errores, construir JSON con detalles de errores
            SET @errors_json = '';
            
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'row', row_index,
                    'field', field_name,
                    'type', error_type,
                    'message', error_message,
                    'data', record_data
                )
            ) INTO @errors_json
            FROM temp_validation_errors;
            
            SET p_result_json = JSON_OBJECT(
                'success', FALSE,
                'message', 'Procesamiento completado con errores',
                'statistics', JSON_OBJECT(
                    'total_rows', v_row_index,
                    'success_count', v_success_count,
                    'error_count', v_error_count,
                    'insert_count', v_insert_count,
                    'update_count', v_update_count,
                    'skip_count', v_skip_count
                ),
                'errors', @errors_json
            );
            
            -- En caso de errores, rollback opcional (configurable)
            -- ROLLBACK;
        ELSE
            -- Todo exitoso, confirmar transacción
            COMMIT;
            
            SET p_result_json = JSON_OBJECT(
                'success', TRUE,
                'message', 'Todos los registros procesados exitosamente',
                'statistics', JSON_OBJECT(
                    'total_rows', v_row_index,
                    'success_count', v_success_count,
                    'error_count', v_error_count,
                    'insert_count', v_insert_count,
                    'update_count', v_update_count,
                    'skip_count', v_skip_count
                )
            );
        END IF;
        
    END; -- Fin del procesamiento principal
    
    -- Limpiar tabla temporal
    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

END$$

DELIMITER ;

-- =====================================================
-- Documentación del SP
-- =====================================================

/*
PARÁMETROS:
- p_json_data (LONGTEXT): Array JSON con datos de reportes de cursables
- p_user_id (INT): ID del usuario que ejecuta la carga
- p_update_mode (VARCHAR): Modo de operación:
  - 'INSERT_ONLY': Solo insertar registros nuevos
  - 'UPDATE_ONLY': Solo actualizar registros existentes  
  - 'UPSERT': Insertar nuevos y actualizar existentes (default)
- p_result_json (LONGTEXT): JSON de respuesta con resultados

ESTRUCTURA DEL JSON DE ENTRADA:
[
  {
    "academic_structure_id": 1,             // Requerido: ID de estructura académica
    "student_count": 45,                    // Opcional: Estudiantes cursables (default: 0)
    "term": "1",                            // Requerido: 1/2/anual/intensivo
    "year": 2025,                           // Requerido: Año académico (2020-2050)
    "section": "A",                         // Opcional: Sección (max 10 chars)
    "modality": "presencial",               // Opcional: presencial/online/mixta (default: presencial)
    "enrolled_count": 50,                   // Opcional: Estudiantes matriculados
    "passed_count": 35,                     // Opcional: Estudiantes aprobados
    "failed_count": 10,                     // Opcional: Estudiantes reprobados
    "withdrawn_count": 5,                   // Opcional: Estudiantes retirados
    "weekly_hours": 6.0,                    // Opcional: Horas semanales
    "total_hours": 108.0,                   // Opcional: Total de horas
    "is_validated": true,                   // Opcional: Si está validado (default: false)
    "notes": "Observaciones del reporte"    // Opcional: Notas adicionales
  }
]

VALIDACIONES IMPLEMENTADAS:
1. Campos requeridos: academic_structure_id, term, year
2. Integridad referencial: academic_structure_id debe existir en academic_structures
3. Enums: term (1/2/anual/intensivo), modality (presencial/online/mixta)
4. Rangos: todos los contadores >= 0, year (2020-2050), horas > 0
5. Longitudes: section (10 chars)
6. Consistencia estadística: suma de aprobados+reprobados+retirados <= matriculados
7. Duplicados: Clave única (academic_structure_id, year, term, section)

CARACTERÍSTICAS:
- Validación completa de reportes académicos con datos estadísticos
- Validación de integridad referencial con estructuras académicas
- Validación de consistencia en datos de rendimiento estudiantil
- Clave única compuesta para evitar duplicados
- Transaccional con manejo robusto de errores
- Reporte detallado de errores de validación
*/
