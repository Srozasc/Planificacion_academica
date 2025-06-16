-- Stored Procedure: sp_CreateUser
-- Descripción: SP para crear un nuevo usuario
-- Parámetros: 
--   IN p_email_institucional VARCHAR(255) - Email institucional del nuevo usuario
--   IN p_password_hash VARCHAR(255) - Hash de la contraseña
--   IN p_name VARCHAR(255) - Nombre completo del usuario
--   IN p_role_id INT - ID del rol a asignar
--   OUT o_user_id INT - ID del usuario creado
--   OUT o_status_code VARCHAR(50) - Código de estado del resultado

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_CreateUser$$

CREATE PROCEDURE sp_CreateUser(
    IN p_email_institucional VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_role_id INT,
    OUT o_user_id INT,
    OUT o_status_code VARCHAR(50)
)
BEGIN
    DECLARE email_count INT DEFAULT 0;
    DECLARE role_count INT DEFAULT 0;
    
    -- Inicializar valores de salida
    SET o_user_id = NULL;
    SET o_status_code = 'ERROR';
    
    -- Verificar si el email ya existe
    SELECT COUNT(*) INTO email_count 
    FROM users 
    WHERE email_institucional = p_email_institucional;
    
    -- Verificar si el rol existe
    SELECT COUNT(*) INTO role_count 
    FROM roles 
    WHERE id = p_role_id;
    
    IF email_count > 0 THEN
        SET o_status_code = 'EMAIL_EXISTS';
    ELSEIF role_count = 0 THEN
        SET o_status_code = 'INVALID_ROLE';
    ELSE
        -- Crear el nuevo usuario
        INSERT INTO users (email_institucional, password_hash, name, role_id, is_active)
        VALUES (p_email_institucional, p_password_hash, p_name, p_role_id, TRUE);
        
        -- Obtener el ID del usuario recién creado
        SET o_user_id = LAST_INSERT_ID();
        SET o_status_code = 'SUCCESS';
    END IF;
    
END$$

DELIMITER ;
