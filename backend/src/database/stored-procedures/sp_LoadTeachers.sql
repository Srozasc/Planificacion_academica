-- =====================================================
-- Stored Procedure: sp_LoadTeachers
-- Descripción: Procesa JSON de docentes desde Excel
-- Valida RUT chileno, duplicados, integridad referencial
-- Autor: Sistema de Planificación Académica
-- Fecha: 2025-06-16
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_LoadTeachers$$

CREATE PROCEDURE sp_LoadTeachers(
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
    DECLARE v_rut VARCHAR(12);
    DECLARE v_name VARCHAR(255);
    DECLARE v_email VARCHAR(255);
    DECLARE v_phone VARCHAR(20);
    DECLARE v_address TEXT;
    DECLARE v_academic_degree VARCHAR(100);
    DECLARE v_specialization VARCHAR(255);
    DECLARE v_university VARCHAR(255);
    DECLARE v_category_code VARCHAR(20);
    DECLARE v_contract_type_code VARCHAR(20);
    DECLARE v_hire_date DATE;
    DECLARE v_contract_hours INT;
    DECLARE v_salary_base DECIMAL(10,2);
    DECLARE v_is_active BOOLEAN;
    DECLARE v_can_coordinate BOOLEAN;
    DECLARE v_max_hours_per_week INT;
    
    -- Variables de validación
    DECLARE v_existing_id INT DEFAULT NULL;
    DECLARE v_category_id INT DEFAULT NULL;
    DECLARE v_contract_type_id INT DEFAULT NULL;
    DECLARE v_rut_normalized VARCHAR(12);
    DECLARE v_rut_valid BOOLEAN DEFAULT FALSE;
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
            SET v_category_id = NULL;
            SET v_contract_type_id = NULL;
            SET v_rut_valid = FALSE;
            
            -- Extraer campos del JSON
            SET v_rut = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.rut'));
            SET v_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.name'));
            SET v_email = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.email'));
            SET v_phone = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.phone'));
            SET v_address = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.address'));
            SET v_academic_degree = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.academic_degree'));
            SET v_specialization = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.specialization'));
            SET v_university = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.university'));
            SET v_category_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.category_code'));
            SET v_contract_type_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.contract_type_code'));
            SET v_hire_date = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.hire_date'));
            SET v_contract_hours = JSON_EXTRACT(@current_record, '$.contract_hours');
            SET v_salary_base = JSON_EXTRACT(@current_record, '$.salary_base');
            SET v_is_active = COALESCE(JSON_EXTRACT(@current_record, '$.is_active'), TRUE);
            SET v_can_coordinate = COALESCE(JSON_EXTRACT(@current_record, '$.can_coordinate'), FALSE);
            SET v_max_hours_per_week = COALESCE(JSON_EXTRACT(@current_record, '$.max_hours_per_week'), 40);
            
            -- ===== VALIDACIONES =====
            
            -- 1. Validar campos requeridos
            IF v_rut IS NULL OR v_rut = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'rut', 'REQUIRED', 'El RUT es requerido', @current_record
                );
            END IF;
            
            IF v_name IS NULL OR v_name = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'name', 'REQUIRED', 'El nombre es requerido', @current_record
                );
            END IF;
            
            IF v_email IS NULL OR v_email = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'email', 'REQUIRED', 'El email es requerido', @current_record
                );
            END IF;
            
            -- 2. Validar formato y longitud de campos
            IF v_name IS NOT NULL AND LENGTH(v_name) > 255 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'name', 'FORMAT', 'El nombre no puede exceder 255 caracteres', @current_record
                );
            END IF;
            
            IF v_email IS NOT NULL AND (LENGTH(v_email) > 255 OR v_email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'email', 'FORMAT', 'El email debe tener formato válido y máximo 255 caracteres', @current_record
                );
            END IF;
            
            IF v_phone IS NOT NULL AND LENGTH(v_phone) > 20 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'phone', 'FORMAT', 'El teléfono no puede exceder 20 caracteres', @current_record
                );
            END IF;
            
            -- 3. Validar RUT chileno
            IF v_rut IS NOT NULL AND v_rut != '' THEN
                -- Normalizar RUT (quitar puntos y guión, dejar solo números y dígito verificador)
                SET v_rut_normalized = UPPER(REPLACE(REPLACE(v_rut, '.', ''), '-', ''));
                
                -- Validar formato básico (7-8 dígitos + dígito verificador)
                IF v_rut_normalized REGEXP '^[0-9]{7,8}[0-9K]$' THEN
                    -- Validar algoritmo del RUT
                    SET @rut_numbers = SUBSTRING(v_rut_normalized, 1, LENGTH(v_rut_normalized) - 1);
                    SET @rut_dv = SUBSTRING(v_rut_normalized, LENGTH(v_rut_normalized), 1);
                    
                    SET @suma = 0;
                    SET @multiplicador = 2;
                    SET @i = LENGTH(@rut_numbers);
                    
                    WHILE @i > 0 DO
                        SET @suma = @suma + (SUBSTRING(@rut_numbers, @i, 1) * @multiplicador);
                        SET @multiplicador = @multiplicador + 1;
                        IF @multiplicador > 7 THEN SET @multiplicador = 2; END IF;
                        SET @i = @i - 1;
                    END WHILE;
                    
                    SET @resto = @suma % 11;
                    SET @dv_calculado = CASE 
                        WHEN @resto = 0 THEN '0'
                        WHEN @resto = 1 THEN 'K'
                        ELSE CAST(11 - @resto AS CHAR)
                    END;
                    
                    IF @dv_calculado = @rut_dv THEN
                        SET v_rut_valid = TRUE;
                        -- Formatear RUT para almacenamiento (sin puntos, con guión)
                        SET v_rut = CONCAT(SUBSTRING(v_rut_normalized, 1, LENGTH(v_rut_normalized) - 1), '-', @rut_dv);
                    END IF;
                END IF;
                
                IF NOT v_rut_valid THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (
                        v_row_index, 'rut', 'FORMAT', 'RUT chileno inválido', @current_record
                    );
                END IF;
            END IF;
            
            -- 4. Validar rangos numéricos
            IF v_contract_hours IS NOT NULL AND (v_contract_hours < 0 OR v_contract_hours > 44) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'contract_hours', 'RANGE', 'Las horas contractuales deben estar entre 0 y 44', @current_record
                );
            END IF;
            
            IF v_salary_base IS NOT NULL AND v_salary_base < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'salary_base', 'RANGE', 'El salario base debe ser mayor o igual a 0', @current_record
                );
            END IF;
            
            IF v_max_hours_per_week IS NOT NULL AND (v_max_hours_per_week < 0 OR v_max_hours_per_week > 60) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'max_hours_per_week', 'RANGE', 'Las horas máximas por semana deben estar entre 0 y 60', @current_record
                );
            END IF;
            
            -- 5. Validar integridad referencial - category_code
            IF v_category_code IS NOT NULL AND v_category_code != '' THEN
                SELECT id INTO v_category_id
                FROM payment_codes 
                WHERE code_name = v_category_code 
                  AND category = 'docente' 
                  AND is_active = TRUE 
                  AND deleted_at IS NULL
                LIMIT 1;
                
                IF v_category_id IS NULL THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (
                        v_row_index, 'category_code', 'FOREIGN_KEY', 
                        CONCAT('Categoría docente con código "', v_category_code, '" no encontrada'), @current_record
                    );
                END IF;
            END IF;
            
            -- 6. Validar integridad referencial - contract_type_code
            IF v_contract_type_code IS NOT NULL AND v_contract_type_code != '' THEN
                SELECT id INTO v_contract_type_id
                FROM payment_codes 
                WHERE code_name = v_contract_type_code 
                  AND type = 'contrato' 
                  AND is_active = TRUE 
                  AND deleted_at IS NULL
                LIMIT 1;
                
                IF v_contract_type_id IS NULL THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (
                        v_row_index, 'contract_type_code', 'FOREIGN_KEY', 
                        CONCAT('Tipo de contrato con código "', v_contract_type_code, '" no encontrado'), @current_record
                    );
                END IF;
            END IF;
            
            -- 7. Validar duplicados según el modo de operación
            SELECT id INTO v_existing_id
            FROM teachers 
            WHERE rut = v_rut AND deleted_at IS NULL
            LIMIT 1;
            
            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'rut', 'DUPLICATE', 
                    CONCAT('El RUT "', v_rut, '" ya existe (modo INSERT_ONLY)'), @current_record
                );
            END IF;
            
            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'rut', 'NOT_FOUND', 
                    CONCAT('El RUT "', v_rut, '" no existe para actualizar (modo UPDATE_ONLY)'), @current_record
                );
            END IF;
            
            -- 8. Validar email único
            IF v_email IS NOT NULL AND EXISTS (
                SELECT 1 FROM teachers 
                WHERE email = v_email 
                  AND (v_existing_id IS NULL OR id != v_existing_id)
                  AND deleted_at IS NULL
            ) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'email', 'DUPLICATE', 
                    CONCAT('El email "', v_email, '" ya está en uso por otro docente'), @current_record
                );
            END IF;
            
            -- ===== PROCESAMIENTO =====
            
            IF v_validation_passed THEN
                -- Determinar operación: INSERT o UPDATE
                IF v_existing_id IS NULL THEN
                    -- INSERT
                    INSERT INTO teachers (
                        rut, name, email, phone, address,
                        academic_degree, specialization, university,
                        category_id, contract_type_id, hire_date,
                        contract_hours, salary_base,
                        is_active, can_coordinate, max_hours_per_week
                    ) VALUES (
                        v_rut, v_name, v_email, v_phone, v_address,
                        v_academic_degree, v_specialization, v_university,
                        v_category_id, v_contract_type_id, v_hire_date,
                        v_contract_hours, v_salary_base,
                        v_is_active, v_can_coordinate, v_max_hours_per_week
                    );
                    
                    SET v_insert_count = v_insert_count + 1;
                    SET v_success_count = v_success_count + 1;
                ELSE
                    -- UPDATE
                    UPDATE teachers SET
                        name = v_name,
                        email = v_email,
                        phone = v_phone,
                        address = v_address,
                        academic_degree = v_academic_degree,
                        specialization = v_specialization,
                        university = v_university,
                        category_id = v_category_id,
                        contract_type_id = v_contract_type_id,
                        hire_date = v_hire_date,
                        contract_hours = v_contract_hours,
                        salary_base = v_salary_base,
                        is_active = v_is_active,
                        can_coordinate = v_can_coordinate,
                        max_hours_per_week = v_max_hours_per_week,
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
- p_json_data (LONGTEXT): Array JSON con datos de docentes
- p_user_id (INT): ID del usuario que ejecuta la carga
- p_update_mode (VARCHAR): Modo de operación:
  - 'INSERT_ONLY': Solo insertar registros nuevos
  - 'UPDATE_ONLY': Solo actualizar registros existentes  
  - 'UPSERT': Insertar nuevos y actualizar existentes (default)
- p_result_json (LONGTEXT): JSON de respuesta con resultados

ESTRUCTURA DEL JSON DE ENTRADA:
[
  {
    "rut": "12345678-9",                    // Requerido: RUT chileno válido
    "name": "Juan Pérez González",          // Requerido: Nombre completo
    "email": "juan.perez@universidad.cl",  // Requerido: Email institucional
    "phone": "+56912345678",                // Opcional: Teléfono
    "address": "Av. Principal 123",         // Opcional: Dirección
    "academic_degree": "Magíster",          // Opcional: Título académico
    "specialization": "Matemáticas",        // Opcional: Especialización
    "university": "Universidad de Chile",   // Opcional: Universidad
    "category_code": "DOC1",                // Opcional: Código categoría docente
    "contract_type_code": "CONT1",          // Opcional: Código tipo contrato
    "hire_date": "2024-03-01",              // Opcional: Fecha contratación
    "contract_hours": 40,                   // Opcional: Horas contractuales
    "salary_base": 1200000.00,              // Opcional: Salario base
    "is_active": true,                      // Opcional: Estado activo
    "can_coordinate": false,                // Opcional: Puede coordinar
    "max_hours_per_week": 44                // Opcional: Horas máx. semanales
  }
]

VALIDACIONES IMPLEMENTADAS:
1. Campos requeridos: rut, name, email
2. Formato RUT: Validación completa de RUT chileno con algoritmo
3. Formato email: Validación de formato estándar
4. Longitudes: name (255), email (255), phone (20)
5. Rangos: contract_hours (0-44), max_hours_per_week (0-60), salary_base (≥0)
6. Integridad referencial: category_code y contract_type_code en payment_codes
7. Duplicados: RUT único, email único
8. Normalización: RUT se normaliza automáticamente

CARACTERÍSTICAS:
- Validación completa de RUT chileno con algoritmo estándar
- Normalización automática de RUT para almacenamiento
- Resolución automática de códigos a IDs (category_code, contract_type_code)
- Validación de email único en el sistema
- Transaccional con manejo robusto de errores
- Reporte detallado de errores de validación
*/
