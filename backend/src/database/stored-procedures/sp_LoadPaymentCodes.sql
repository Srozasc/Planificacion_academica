-- =====================================================
-- Stored Procedure: sp_LoadPaymentCodes
-- Descripción: Procesa JSON de códigos de pago desde Excel
-- Valida códigos únicos, factores, fechas y categorización
-- Autor: Sistema de Planificación Académica
-- Fecha: 2025-06-16
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_LoadPaymentCodes$$

CREATE PROCEDURE sp_LoadPaymentCodes(
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
    DECLARE v_code_name VARCHAR(20);
    DECLARE v_description VARCHAR(255);
    DECLARE v_factor DECIMAL(8,4);
    DECLARE v_base_amount DECIMAL(10,2);
    DECLARE v_category VARCHAR(20);
    DECLARE v_type VARCHAR(20);
    DECLARE v_is_active BOOLEAN;
    DECLARE v_requires_hours BOOLEAN;
    DECLARE v_is_taxable BOOLEAN;
    DECLARE v_valid_from DATE;
    DECLARE v_valid_until DATE;
    
    -- Variables de validación
    DECLARE v_existing_id INT DEFAULT NULL;
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
            
            -- Extraer campos del JSON
            SET v_code_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.code_name'));
            SET v_description = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.description'));
            SET v_factor = JSON_EXTRACT(@current_record, '$.factor');
            SET v_base_amount = JSON_EXTRACT(@current_record, '$.base_amount');
            SET v_category = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.category'));
            SET v_type = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.type'));
            SET v_is_active = COALESCE(JSON_EXTRACT(@current_record, '$.is_active'), TRUE);
            SET v_requires_hours = COALESCE(JSON_EXTRACT(@current_record, '$.requires_hours'), FALSE);
            SET v_is_taxable = COALESCE(JSON_EXTRACT(@current_record, '$.is_taxable'), TRUE);
            SET v_valid_from = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.valid_from'));
            SET v_valid_until = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.valid_until'));
            
            -- ===== VALIDACIONES =====
            
            -- 1. Validar campos requeridos
            IF v_code_name IS NULL OR v_code_name = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'REQUIRED', 'El código de pago es requerido', @current_record
                );
            END IF;
            
            IF v_description IS NULL OR v_description = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'description', 'REQUIRED', 'La descripción es requerida', @current_record
                );
            END IF;
            
            IF v_factor IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'factor', 'REQUIRED', 'El factor es requerido', @current_record
                );
            END IF;
            
            IF v_category IS NULL OR v_category = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'category', 'REQUIRED', 'La categoría es requerida', @current_record
                );
            END IF;
            
            IF v_type IS NULL OR v_type = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'type', 'REQUIRED', 'El tipo es requerido', @current_record
                );
            END IF;
            
            -- 2. Validar formato y longitud de campos
            IF v_code_name IS NOT NULL AND (LENGTH(v_code_name) > 20 OR LENGTH(v_code_name) < 2) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'FORMAT', 'El código debe tener entre 2 y 20 caracteres', @current_record
                );
            END IF;
            
            IF v_description IS NOT NULL AND LENGTH(v_description) > 255 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'description', 'FORMAT', 'La descripción no puede exceder 255 caracteres', @current_record
                );
            END IF;
            
            -- 3. Validar valores numéricos
            IF v_factor IS NOT NULL AND v_factor <= 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'factor', 'RANGE', 'El factor debe ser mayor a 0', @current_record
                );
            END IF;
            
            IF v_base_amount IS NOT NULL AND v_base_amount < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'base_amount', 'RANGE', 'El monto base debe ser mayor o igual a 0', @current_record
                );
            END IF;
            
            -- 4. Validar enums
            IF v_category IS NOT NULL AND v_category NOT IN ('docente', 'administrativo', 'otro') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'category', 'ENUM', 'La categoría debe ser: docente, administrativo o otro', @current_record
                );
            END IF;
            
            IF v_type IS NOT NULL AND v_type NOT IN ('categoria', 'contrato', 'bono', 'descuento', 'hora') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'type', 'ENUM', 'El tipo debe ser: categoria, contrato, bono, descuento o hora', @current_record
                );
            END IF;
            
            -- 5. Validar fechas
            IF v_valid_from IS NOT NULL AND v_valid_from != '' AND NOT v_valid_from REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'valid_from', 'FORMAT', 'La fecha desde debe tener formato YYYY-MM-DD', @current_record
                );
            END IF;
            
            IF v_valid_until IS NOT NULL AND v_valid_until != '' AND NOT v_valid_until REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'valid_until', 'FORMAT', 'La fecha hasta debe tener formato YYYY-MM-DD', @current_record
                );
            END IF;
            
            -- 6. Validar coherencia de fechas
            IF v_valid_from IS NOT NULL AND v_valid_from != '' AND 
               v_valid_until IS NOT NULL AND v_valid_until != '' AND 
               v_valid_until < v_valid_from THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'valid_until', 'LOGIC', 'La fecha hasta debe ser mayor o igual a la fecha desde', @current_record
                );
            END IF;
            
            -- 7. Validar duplicados según el modo de operación
            SELECT id INTO v_existing_id
            FROM payment_codes 
            WHERE code_name = v_code_name AND deleted_at IS NULL
            LIMIT 1;
            
            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'DUPLICATE', 
                    CONCAT('El código "', v_code_name, '" ya existe (modo INSERT_ONLY)'), @current_record
                );
            END IF;
            
            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'NOT_FOUND', 
                    CONCAT('El código "', v_code_name, '" no existe para actualizar (modo UPDATE_ONLY)'), @current_record
                );
            END IF;
            
            -- 8. Validaciones de negocio específicas
            -- Los códigos que requieren horas deben ser de tipo 'hora'
            IF v_requires_hours = TRUE AND v_type != 'hora' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'requires_hours', 'LOGIC', 
                    'Solo los códigos de tipo "hora" pueden requerir horas', @current_record
                );
            END IF;
            
            -- Los descuentos deberían tener factor menor a 1
            IF v_type = 'descuento' AND v_factor >= 1 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'factor', 'LOGIC', 
                    'Los descuentos deberían tener factor menor a 1', @current_record
                );
            END IF;
            
            -- ===== PROCESAMIENTO =====
            
            IF v_validation_passed THEN
                -- Convertir fechas vacías a NULL
                IF v_valid_from = '' THEN SET v_valid_from = NULL; END IF;
                IF v_valid_until = '' THEN SET v_valid_until = NULL; END IF;
                
                -- Determinar operación: INSERT o UPDATE
                IF v_existing_id IS NULL THEN
                    -- INSERT
                    INSERT INTO payment_codes (
                        code_name, description, factor, base_amount,
                        category, type, is_active, requires_hours, is_taxable,
                        valid_from, valid_until
                    ) VALUES (
                        v_code_name, v_description, v_factor, v_base_amount,
                        v_category, v_type, v_is_active, v_requires_hours, v_is_taxable,
                        v_valid_from, v_valid_until
                    );
                    
                    SET v_insert_count = v_insert_count + 1;
                    SET v_success_count = v_success_count + 1;
                ELSE
                    -- UPDATE
                    UPDATE payment_codes SET
                        description = v_description,
                        factor = v_factor,
                        base_amount = v_base_amount,
                        category = v_category,
                        type = v_type,
                        is_active = v_is_active,
                        requires_hours = v_requires_hours,
                        is_taxable = v_is_taxable,
                        valid_from = v_valid_from,
                        valid_until = v_valid_until,
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
- p_json_data (LONGTEXT): Array JSON con datos de códigos de pago
- p_user_id (INT): ID del usuario que ejecuta la carga
- p_update_mode (VARCHAR): Modo de operación:
  - 'INSERT_ONLY': Solo insertar registros nuevos
  - 'UPDATE_ONLY': Solo actualizar registros existentes  
  - 'UPSERT': Insertar nuevos y actualizar existentes (default)
- p_result_json (LONGTEXT): JSON de respuesta con resultados

ESTRUCTURA DEL JSON DE ENTRADA:
[
  {
    "code_name": "DOC1",                    // Requerido: Código único (2-20 chars)
    "description": "Profesor Titular",      // Requerido: Descripción (max 255)
    "factor": 1.5000,                       // Requerido: Factor > 0
    "base_amount": 2500000.00,              // Opcional: Monto base >= 0
    "category": "docente",                  // Requerido: docente/administrativo/otro
    "type": "categoria",                    // Requerido: categoria/contrato/bono/descuento/hora
    "is_active": true,                      // Opcional: Estado activo (default: true)
    "requires_hours": false,                // Opcional: Requiere horas (default: false)
    "is_taxable": true,                     // Opcional: Afecto a impuestos (default: true)
    "valid_from": "2024-01-01",             // Opcional: Fecha desde (YYYY-MM-DD)
    "valid_until": "2024-12-31"             // Opcional: Fecha hasta (YYYY-MM-DD)
  }
]

VALIDACIONES IMPLEMENTADAS:
1. Campos requeridos: code_name, description, factor, category, type
2. Formato code_name: 2-20 caracteres
3. Longitudes: description (255 chars)
4. Rangos: factor > 0, base_amount >= 0
5. Enums: category (docente/administrativo/otro), type (categoria/contrato/bono/descuento/hora)
6. Fechas: Formato YYYY-MM-DD, valid_until >= valid_from
7. Duplicados: code_name único
8. Lógica de negocio: requires_hours solo para tipo 'hora', descuentos con factor < 1

CARACTERÍSTICAS:
- Validación completa de códigos de pago con factores y categorización
- Validación de fechas de vigencia con formato ISO
- Validaciones de lógica de negocio específicas
- Transaccional con manejo robusto de errores
- Reporte detallado de errores de validación
*/
