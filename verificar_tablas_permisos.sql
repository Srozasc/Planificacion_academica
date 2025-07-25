-- Script para verificar el estado de las tablas del sistema de permisos
-- Ejecutar cada consulta por separado y proporcionar los resultados

-- 1. Verificar conteo de registros en todas las tablas relevantes
SELECT 'users' as tabla, COUNT(*) as registros FROM users;
SELECT 'permisos_pendientes' as tabla, COUNT(*) as registros FROM permisos_pendientes;
SELECT 'usuario_permisos_carrera' as tabla, COUNT(*) as registros FROM usuario_permisos_carrera;
SELECT 'usuario_permisos_categoria' as tabla, COUNT(*) as registros FROM usuario_permisos_categoria;
SELECT 'carreras' as tabla, COUNT(*) as registros FROM carreras;
SELECT 'asignaturas' as tabla, COUNT(*) as registros FROM asignaturas;
SELECT 'staging_estructura_academica' as tabla, COUNT(*) as registros FROM staging_estructura_academica;

-- 2. Verificar estado de permisos_pendientes
SELECT 
    estado, 
    COUNT(*) as cantidad,
    MIN(fecha_creacion) as primera_fecha,
    MAX(fecha_creacion) as ultima_fecha
FROM permisos_pendientes 
GROUP BY estado;

-- 3. Verificar si existen registros pendientes
SELECT 
    id,
    usuario_mail,
    permiso_carrera_codigo,
    permiso_categoria,
    estado,
    mensaje_error,
    intentos_procesamiento
FROM permisos_pendientes 
WHERE estado = 'PENDIENTE'
LIMIT 10;

-- 4. Verificar si existen carreras
SELECT 
    id,
    codigo_plan,
    nombre_carrera,
    activo
FROM carreras 
LIMIT 10;

-- 5. Verificar si existen asignaturas
SELECT 
    a.id,
    a.sigla,
    a.nombre,
    a.categoria_asignatura,
    c.codigo_plan,
    c.nombre_carrera
FROM asignaturas a
JOIN carreras c ON a.carrera_id = c.id
LIMIT 10;

-- 6. Verificar usuarios creados recientemente
SELECT 
    id,
    email_institucional,
    name,
    role_id,
    role_expires_at,
    previous_role_id,
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar si hay datos en staging_estructura_academica
SELECT 
    plan,
    carrera,
    sigla,
    asignatura,
    categoria
FROM staging_estructura_academica
LIMIT 10;

-- 8. Verificar errores en permisos_pendientes
SELECT 
    id,
    usuario_mail,
    estado,
    mensaje_error,
    intentos_procesamiento,
    fecha_creacion
FROM permisos_pendientes 
WHERE estado = 'ERROR'
LIMIT 10;