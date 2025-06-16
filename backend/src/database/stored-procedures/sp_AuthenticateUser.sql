-- Stored Procedure: sp_AuthenticateUser
-- Descripción: SP para verificar las credenciales del usuario (email y hash de contraseña)
-- Parámetros: 
--   IN p_email VARCHAR(255) - Email institucional del usuario
--   IN p_password_hash VARCHAR(255) - Hash de la contraseña para comparar
--   OUT o_user_id INT - ID del usuario autenticado
--   OUT o_role_name VARCHAR(50) - Nombre del rol del usuario
--   OUT o_user_name VARCHAR(255) - Nombre completo del usuario
--   OUT o_status_code VARCHAR(50) - Código de estado del resultado

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_AuthenticateUser$$

CREATE PROCEDURE sp_AuthenticateUser(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    OUT o_user_id INT,
    OUT o_role_name VARCHAR(50),
    OUT o_user_name VARCHAR(255),
    OUT o_status_code VARCHAR(50)
)
BEGIN
    DECLARE user_count INT DEFAULT 0;
    DECLARE user_active INT DEFAULT 0;
    DECLARE stored_hash VARCHAR(255) DEFAULT '';
    
    -- Inicializar valores de salida
    SET o_user_id = NULL;
    SET o_role_name = NULL;
    SET o_user_name = NULL;
    SET o_status_code = 'ERROR';
    
    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO user_count 
    FROM users 
    WHERE email_institucional = p_email;
    
    IF user_count = 0 THEN
        SET o_status_code = 'USER_NOT_FOUND';
    ELSE
        -- Obtener información del usuario
        SELECT 
            u.id, 
            u.name, 
            u.is_active, 
            u.password_hash,
            r.name as role_name
        INTO 
            o_user_id, 
            o_user_name, 
            user_active, 
            stored_hash,
            o_role_name
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.email_institucional = p_email;
        
        -- Verificar si la cuenta está activa
        IF user_active = 0 THEN
            SET o_status_code = 'ACCOUNT_DISABLED';
            SET o_user_id = NULL;
            SET o_role_name = NULL;
            SET o_user_name = NULL;
        ELSE
            -- Verificar contraseña
            IF stored_hash = p_password_hash THEN
                SET o_status_code = 'SUCCESS';
            ELSE
                SET o_status_code = 'INVALID_CREDENTIALS';
                SET o_user_id = NULL;
                SET o_role_name = NULL;
                SET o_user_name = NULL;
            END IF;
        END IF;
    END IF;
    
END$$

DELIMITER ;
