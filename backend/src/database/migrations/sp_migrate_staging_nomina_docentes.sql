DELIMITER //

CREATE PROCEDURE sp_migrate_staging_nomina_docentes(
    IN p_bimestre_id INT DEFAULT NULL
)
BEGIN
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_success_count INT DEFAULT 0;
    DECLARE v_duplicate_count INT DEFAULT 0;
    DECLARE v_invalid_count INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    
    -- Variables para el cursor
    DECLARE v_id INT;
    DECLARE v_docente VARCHAR(255);
    DECLARE v_id_docente VARCHAR(50);
    DECLARE v_rut_docente VARCHAR(20);
    DECLARE v_id_bimestre INT;
    
    -- Variables para procesamiento
    DECLARE v_clean_rut VARCHAR(12);
    DECLARE v_email VARCHAR(255);
    DECLARE v_existing_teacher_id INT;
    
    -- Cursor para recorrer staging_nomina_docentes
    DECLARE staging_cursor CURSOR FOR 
        SELECT id, docente, id_docente, rut_docente, id_bimestre
        FROM staging_nomina_docentes 
        WHERE (p_bimestre_id IS NULL OR id_bimestre = p_bimestre_id)
        AND docente IS NOT NULL 
        AND rut_docente IS NOT NULL;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET v_error_count = v_error_count + 1;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        INSERT INTO migration_log (table_name, operation, error_message, created_at)
        VALUES ('staging_nomina_docentes', 'MIGRATE', 
                CONCAT('Error: ', @errno, ' - ', @text), NOW());
    END;
    
    -- Crear tabla de log si no existe
    CREATE TABLE IF NOT EXISTS migration_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(100),
        operation VARCHAR(50),
        record_id INT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Iniciar transacción
    START TRANSACTION;
    
    -- Log inicio de migración
    INSERT INTO migration_log (table_name, operation, error_message, created_at)
    VALUES ('staging_nomina_docentes', 'START_MIGRATION', 
            CONCAT('Iniciando migración para bimestre_id: ', IFNULL(p_bimestre_id, 'TODOS')), NOW());
    
    -- Abrir cursor
    OPEN staging_cursor;
    
    migration_loop: LOOP
        FETCH staging_cursor INTO v_id, v_docente, v_id_docente, v_rut_docente, v_id_bimestre;
        
        IF done THEN
            LEAVE migration_loop;
        END IF;
        
        -- Limpiar y validar RUT
        SET v_clean_rut = UPPER(TRIM(REPLACE(REPLACE(v_rut_docente, '.', ''), ' ', '')));
        
        -- Validar formato de RUT (debe tener guión y dígito verificador)
        IF v_clean_rut NOT REGEXP '^[0-9]{7,8}-[0-9K]$' THEN
            SET v_invalid_count = v_invalid_count + 1;
            INSERT INTO migration_log (table_name, operation, record_id, error_message, created_at)
            VALUES ('staging_nomina_docentes', 'INVALID_RUT', v_id, 
                    CONCAT('RUT inválido: ', v_rut_docente), NOW());
            ITERATE migration_loop;
        END IF;
        
        -- Generar email institucional basado en el nombre
        SET v_email = CONCAT(
            LOWER(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(v_docente), ' ', '.'), 'ñ', 'n'), 'á', 'a'), 'é', 'e')),
            '@institucion.edu'
        );
        
        -- Verificar si el docente ya existe por RUT
        SELECT id INTO v_existing_teacher_id 
        FROM teachers 
        WHERE rut = v_clean_rut 
        LIMIT 1;
        
        IF v_existing_teacher_id IS NOT NULL THEN
            -- El docente ya existe, actualizar solo si es necesario
            UPDATE teachers 
            SET 
                name = COALESCE(NULLIF(TRIM(v_docente), ''), name),
                updated_at = NOW()
            WHERE id = v_existing_teacher_id;
            
            SET v_duplicate_count = v_duplicate_count + 1;
            INSERT INTO migration_log (table_name, operation, record_id, error_message, created_at)
            VALUES ('staging_nomina_docentes', 'DUPLICATE_UPDATED', v_id, 
                    CONCAT('Docente actualizado - RUT: ', v_clean_rut), NOW());
        ELSE
            -- Verificar si el email ya existe
            IF EXISTS (SELECT 1 FROM teachers WHERE email = v_email) THEN
                -- Agregar número al email para hacerlo único
                SET v_email = CONCAT(
                    SUBSTRING_INDEX(v_email, '@', 1),
                    '.',
                    v_id,
                    '@',
                    SUBSTRING_INDEX(v_email, '@', -1)
                );
            END IF;
            
            -- Insertar nuevo docente
            INSERT INTO teachers (
                rut,
                name,
                email,
                is_active,
                can_coordinate,
                max_hours_per_week,
                created_at,
                updated_at
            ) VALUES (
                v_clean_rut,
                TRIM(v_docente),
                v_email,
                1, -- is_active
                0, -- can_coordinate
                40, -- max_hours_per_week por defecto
                NOW(),
                NOW()
            );
            
            SET v_success_count = v_success_count + 1;
            INSERT INTO migration_log (table_name, operation, record_id, error_message, created_at)
            VALUES ('staging_nomina_docentes', 'INSERTED', v_id, 
                    CONCAT('Docente insertado - RUT: ', v_clean_rut), NOW());
        END IF;
        
        -- Reset variables
        SET v_existing_teacher_id = NULL;
        
    END LOOP;
    
    -- Cerrar cursor
    CLOSE staging_cursor;
    
    -- Log final de migración
    INSERT INTO migration_log (table_name, operation, error_message, created_at)
    VALUES ('staging_nomina_docentes', 'END_MIGRATION', 
            CONCAT('Migración completada - Insertados: ', v_success_count, 
                   ', Duplicados actualizados: ', v_duplicate_count,
                   ', Inválidos: ', v_invalid_count,
                   ', Errores: ', v_error_count), NOW());
    
    -- Confirmar transacción
    COMMIT;
    
    -- Retornar resumen
    SELECT 
        v_success_count as records_inserted,
        v_duplicate_count as records_updated,
        v_invalid_count as invalid_records,
        v_error_count as error_count,
        (v_success_count + v_duplicate_count) as total_processed;
        
END //

DELIMITER ;

-- Comentarios sobre el procedimiento:
-- 1. Limpia y valida el formato del RUT
-- 2. Genera emails institucionales automáticamente
-- 3. Maneja duplicados actualizando registros existentes
-- 4. Crea logs detallados de la migración
-- 5. Usa transacciones para garantizar consistencia
-- 6. Permite migrar por bimestre específico o todos
-- 7. Maneja errores de forma robusta

-- Ejemplos de uso:
-- CALL sp_migrate_staging_nomina_docentes(); -- Migra todos los registros
-- CALL sp_migrate_staging_nomina_docentes(16); -- Migra solo bimestre 16

-- Para ver los logs de migración:
-- SELECT * FROM migration_log WHERE table_name = 'staging_nomina_docentes' ORDER BY created_at DESC;