-- Migración 004: Crear tabla RolePermissions
-- Descripción: Tabla pivot para la relación muchos-a-muchos entre Roles y Permisos

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clave primaria compuesta
    PRIMARY KEY (role_id, permission_id),
    
    -- Claves foráneas
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id)
);

-- Comentarios de la tabla
ALTER TABLE role_permissions COMMENT = 'Tabla pivot que relaciona roles con permisos';
