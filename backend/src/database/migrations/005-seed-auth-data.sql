-- Migración 005: Poblar tablas con datos iniciales
-- Descripción: Insertar los roles base, permisos iniciales y sus asignaciones

-- Insertar roles base
INSERT INTO roles (name, description) VALUES 
('Administrador', 'Usuario con acceso completo al sistema'),
('Director/Jefe de Programa', 'Usuario con permisos de gestión académica y visualización de reportes'),
('Usuario Lector', 'Usuario con permisos de solo lectura para consultas y reportes')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insertar permisos base para MVP
INSERT INTO permissions (name, description) VALUES 
('manage_users', 'Crear, editar y eliminar usuarios del sistema'),
('view_users', 'Ver listado y detalles de usuarios'),
('manage_schedule_all_areas', 'Gestionar horarios de todas las áreas académicas'),
('manage_schedule_own_area', 'Gestionar horarios solo de su área académica asignada'),
('view_schedule_all_areas', 'Ver horarios de todas las áreas académicas'),
('view_schedule_own_area', 'Ver horarios solo de su área académica'),
('upload_academic_data', 'Cargar datos académicos (estructura, profesores, reportes)'),
('generate_reports', 'Generar y exportar reportes del sistema'),
('view_reports', 'Ver reportes generados'),
('approve_schedules', 'Aprobar o rechazar horarios en el flujo de aprobaciones'),
('request_schedule_approval', 'Solicitar aprobación de horarios'),
('manage_resources', 'Gestionar recursos académicos (aulas, equipos, etc.)'),
('view_dashboard', 'Acceder al dashboard principal del sistema')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Asignar permisos a roles
-- ADMINISTRADOR: Todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Administrador'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- DIRECTOR/JEFE DE PROGRAMA: Permisos de gestión académica
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Director/Jefe de Programa'
AND p.name IN (
    'view_users',
    'manage_schedule_own_area',
    'view_schedule_all_areas', 
    'upload_academic_data',
    'generate_reports',
    'view_reports',
    'approve_schedules',
    'request_schedule_approval',
    'manage_resources',
    'view_dashboard'
)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- USUARIO LECTOR: Solo permisos de lectura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Usuario Lector'
AND p.name IN (
    'view_schedule_own_area',
    'view_reports',
    'view_dashboard'
)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- Crear usuario administrador por defecto
INSERT INTO users (email_institucional, password_hash, name, role_id)
SELECT 
    'admin@planificacion.edu',
    '$2b$10$rQw8Qx8Qx8Qx8Qx8Qx8Qu.dummy.hash.placeholder',  -- Hash dummy, se debe actualizar
    'Administrador del Sistema',
    r.id
FROM roles r 
WHERE r.name = 'Administrador'
ON DUPLICATE KEY UPDATE name = VALUES(name);
