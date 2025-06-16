-- Stored Procedure: sp_GetUserPermissions
-- Descripción: SP para obtener la lista de nombres de permisos para un user_id dado
-- Parámetros: 
--   IN p_user_id INT - ID del usuario para obtener permisos

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_GetUserPermissions$$

CREATE PROCEDURE sp_GetUserPermissions(
    IN p_user_id INT
)
BEGIN
    -- Obtener permisos del usuario basado en su rol
    SELECT 
        p.name as permission_name,
        p.description as permission_description
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN role_permissions rp ON r.id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id
    AND u.is_active = TRUE
    ORDER BY p.name;
    
END$$

DELIMITER ;
