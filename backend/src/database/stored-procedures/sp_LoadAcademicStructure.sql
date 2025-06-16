-- =====================================================
-- Stored Procedure: sp_LoadAcademicStructure
-- Descripción: Procesa JSON de Estructura Académica desde Excel
-- Valida duplicados, integridad referencial e inserta/actualiza registros
-- Autor: Sistema de Planificación Académica
-- Fecha: 2025-06-16
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_LoadAcademicStructure$$

CREATE PROCEDURE sp_LoadAcademicStructure(
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
    DECLARE v_code VARCHAR(20);
    DECLARE v_name VARCHAR(255);
    DECLARE v_credits INT;
    DECLARE v_plan_id INT;
    DECLARE v_plan_code VARCHAR(20);    DECLARE v_type VARCHAR(20);
    DECLARE v_semester INT;
    DECLARE v_prerequisites TEXT;
    DECLARE v_description TEXT;
    DECLARE v_hours_per_week INT;
    DECLARE v_is_active BOOLEAN;
    
    -- Variables de validación
    DECLARE v_existing_id INT DEFAULT NULL;
    DECLARE v_plan_id_resolved INT DEFAULT NULL;
    DECLARE v_error_message TEXT DEFAULT '';
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
        ROLLBACK;        LEAVE proc_main;
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
            SET v_error_message = '';
            SET v_plan_id_resolved = NULL;
            
            -- Extraer campos del JSON
            SET v_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.code'));
            SET v_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.name'));
            SET v_credits = JSON_EXTRACT(@current_record, '$.credits');
            SET v_plan_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.plan_code'));
            SET v_type = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.type'));
            SET v_semester = JSON_EXTRACT(@current_record, '$.semester');
            SET v_prerequisites = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.prerequisites'));
            SET v_description = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.description'));
            SET v_hours_per_week = JSON_EXTRACT(@current_record, '$.hours_per_week');
            SET v_is_active = COALESCE(JSON_EXTRACT(@current_record, '$.is_active'), TRUE);
            
            -- ===== VALIDACIONES =====
            
            -- 1. Validar campos requeridos
            IF v_code IS NULL OR v_code = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code', 'REQUIRED', 'El código es requerido', @current_record
                );
            END IF;
            
            IF v_name IS NULL OR v_name = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'name', 'REQUIRED', 'El nombre es requerido', @current_record
                );
            END IF;
            
            IF v_type IS NULL OR v_type = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'type', 'REQUIRED', 'El tipo es requerido', @current_record
                );
            END IF;
            
            -- 2. Validar formato y longitud de campos
            IF v_code IS NOT NULL AND (LENGTH(v_code) > 20 OR LENGTH(v_code) < 2) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code', 'FORMAT', 'El código debe tener entre 2 y 20 caracteres', @current_record
                );
            END IF;
            
            IF v_name IS NOT NULL AND LENGTH(v_name) > 255 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'name', 'FORMAT', 'El nombre no puede exceder 255 caracteres', @current_record
                );
            END IF;
            
            -- 3. Validar enums y rangos
            IF v_type IS NOT NULL AND v_type NOT IN ('subject', 'plan', 'module') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'type', 'ENUM', 'El tipo debe ser: subject, plan o module', @current_record
                );
            END IF;
            
            IF v_credits IS NOT NULL AND (v_credits < 0 OR v_credits > 20) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'credits', 'RANGE', 'Los créditos deben estar entre 0 y 20', @current_record
                );
            END IF;
            
            IF v_semester IS NOT NULL AND (v_semester < 1 OR v_semester > 10) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'semester', 'RANGE', 'El semestre debe estar entre 1 y 10', @current_record
                );
            END IF;
            
            IF v_hours_per_week IS NOT NULL AND (v_hours_per_week < 0 OR v_hours_per_week > 50) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'hours_per_week', 'RANGE', 'Las horas por semana deben estar entre 0 y 50', @current_record
                );
            END IF;
            
            -- 4. Validar integridad referencial - plan_code
            IF v_plan_code IS NOT NULL AND v_plan_code != '' THEN
                SELECT id INTO v_plan_id_resolved
                FROM academic_structures 
                WHERE code = v_plan_code AND type = 'plan' AND deleted_at IS NULL
                LIMIT 1;
                
                IF v_plan_id_resolved IS NULL THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (
                        v_row_index, 'plan_code', 'FOREIGN_KEY', 
                        CONCAT('Plan con código "', v_plan_code, '" no encontrado'), @current_record
                    );
                END IF;
            END IF;
            
            -- 5. Validar duplicados según el modo de operación
            SELECT id INTO v_existing_id
            FROM academic_structures 
            WHERE code = v_code AND deleted_at IS NULL
            LIMIT 1;
            
            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code', 'DUPLICATE', 
                    CONCAT('El código "', v_code, '" ya existe (modo INSERT_ONLY)'), @current_record
                );
            END IF;
            
            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code', 'NOT_FOUND', 
                    CONCAT('El código "', v_code, '" no existe para actualizar (modo UPDATE_ONLY)'), @current_record
                );
            END IF;
            
            -- ===== PROCESAMIENTO =====
            
            IF v_validation_passed THEN
                -- Determinar operación: INSERT o UPDATE
                IF v_existing_id IS NULL THEN
                    -- INSERT
                    INSERT INTO academic_structures (
                        code, name, credits, plan_id, type, semester, 
                        prerequisites, description, hours_per_week, is_active
                    ) VALUES (
                        v_code, v_name, v_credits, v_plan_id_resolved, v_type, v_semester,
                        v_prerequisites, v_description, v_hours_per_week, v_is_active
                    );
                    
                    SET v_insert_count = v_insert_count + 1;
                    SET v_success_count = v_success_count + 1;
                ELSE
                    -- UPDATE
                    UPDATE academic_structures SET
                        name = v_name,
                        credits = v_credits,
                        plan_id = v_plan_id_resolved,
                        type = v_type,
                        semester = v_semester,
                        prerequisites = v_prerequisites,
                        description = v_description,
                        hours_per_week = v_hours_per_week,
                        is_active = v_is_active,
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
            );        END IF;
        
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
- p_json_data (LONGTEXT): Array JSON con datos de estructura académica
- p_user_id (INT): ID del usuario que ejecuta la carga
- p_update_mode (ENUM): Modo de operación:
  - 'INSERT_ONLY': Solo insertar registros nuevos
  - 'UPDATE_ONLY': Solo actualizar registros existentes  
  - 'UPSERT': Insertar nuevos y actualizar existentes (default)
- p_result_json (LONGTEXT): JSON de respuesta con resultados

ESTRUCTURA DEL JSON DE ENTRADA:
[
  {
    "code": "MAT101",
    "name": "Matemáticas I",
    "credits": 4,
    "plan_code": "ING2024", // Código del plan (opcional)
    "type": "subject",
    "semester": 1,
    "prerequisites": "MAT100,ALG101", // Códigos separados por coma (opcional)
    "description": "Curso de matemáticas básicas", // (opcional)
    "hours_per_week": 6, // (opcional)
    "is_active": true // (opcional, default: true)
  }
]

ESTRUCTURA DEL JSON DE RESPUESTA:
{
  "success": boolean,
  "message": "string",
  "statistics": {
    "total_rows": int,
    "success_count": int,
    "error_count": int,
    "insert_count": int,
    "update_count": int,
    "skip_count": int
  },
  "errors": [ // Solo si hay errores
    {
      "row": int,
      "field": "string",
      "type": "string",
      "message": "string",
      "data": object
    }
  ]
}

EJEMPLO DE USO:
CALL sp_LoadAcademicStructure(
  '[{"code":"MAT101","name":"Matemáticas I","credits":4,"type":"subject","semester":1}]',
  1,
  'UPSERT',
  @result
);
SELECT @result;

VALIDACIONES IMPLEMENTADAS:
1. Campos requeridos: code, name, type
2. Formato y longitud: code (2-20 chars), name (max 255 chars)
3. Enums: type (subject/plan/module)
4. Rangos: credits (0-20), semester (1-10), hours_per_week (0-50)
5. Integridad referencial: plan_code debe existir como plan activo
6. Duplicados: según modo de operación

CARACTERÍSTICAS:
- Transaccional: rollback en caso de error SQL
- Validación completa antes de inserción
- Soporte para inserción y actualización
- Resolución automática de referencias (plan_code -> plan_id)
- Reporte detallado de errores de validación
- Estadísticas de procesamiento
*/
