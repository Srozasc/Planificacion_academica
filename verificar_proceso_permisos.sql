-- Script adicional para diagnosticar por qué no se ejecuta la resolución de permisos
-- Ejecutar estas consultas para entender el flujo de procesamiento

-- 1. Verificar si existen registros PENDIENTES que deberían procesarse
SELECT 
    'Registros PENDIENTES' as diagnostico,
    COUNT(*) as cantidad
FROM permisos_pendientes 
WHERE estado = 'PENDIENTE';

-- 2. Verificar si las carreras referenciadas en permisos_pendientes existen
SELECT 
    'Carreras faltantes' as diagnostico,
    COUNT(DISTINCT pp.permiso_carrera_codigo) as cantidad
FROM permisos_pendientes pp
LEFT JOIN carreras c ON pp.permiso_carrera_codigo = c.codigo_plan
WHERE pp.estado = 'PENDIENTE' 
  AND pp.permiso_carrera_codigo IS NOT NULL 
  AND c.id IS NULL;

-- 3. Verificar códigos de carrera únicos en permisos_pendientes
SELECT 
    permiso_carrera_codigo,
    COUNT(*) as usuarios_con_este_codigo
FROM permisos_pendientes 
WHERE estado = 'PENDIENTE' 
  AND permiso_carrera_codigo IS NOT NULL
GROUP BY permiso_carrera_codigo
ORDER BY usuarios_con_este_codigo DESC;

-- 4. Verificar códigos de carrera que SÍ existen en la tabla carreras
SELECT 
    c.codigo_plan,
    c.nombre_carrera,
    COUNT(pp.id) as usuarios_pendientes
FROM carreras c
LEFT JOIN permisos_pendientes pp ON c.codigo_plan = pp.permiso_carrera_codigo AND pp.estado = 'PENDIENTE'
GROUP BY c.id, c.codigo_plan, c.nombre_carrera
ORDER BY usuarios_pendientes DESC;

-- 5. Verificar categorías en permisos_pendientes
SELECT 
    permiso_categoria,
    COUNT(*) as usuarios_con_esta_categoria
FROM permisos_pendientes 
WHERE estado = 'PENDIENTE' 
  AND permiso_categoria IS NOT NULL
GROUP BY permiso_categoria;

-- 6. Verificar si hay lock files o procesos bloqueados (buscar en logs)
SELECT 
    'Último procesamiento' as info,
    MAX(fecha_procesado) as ultima_fecha_procesado
FROM permisos_pendientes 
WHERE estado = 'PROCESADO';

-- 7. Verificar estructura de datos en permisos_pendientes
SELECT 
    usuario_mail,
    usuario_nombre,
    permiso_carrera_codigo,
    tipo_rol,
    permiso_categoria,
    fecha_expiracion,
    estado,
    fecha_creacion
FROM permisos_pendientes 
ORDER BY fecha_creacion DESC
LIMIT 5;

-- 8. Verificar roles disponibles en el sistema
SELECT 
    id,
    name,
    description
FROM roles 
ORDER BY id;