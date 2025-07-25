-- =====================================================
-- MIGRACIÓN: Soporte Temporal para Carreras y Asignaturas
-- Versión: 1.0
-- Fecha: 2025-01-17
-- Descripción: Agrega bimestre_id a tablas finales para preservar historial temporal
-- =====================================================

-- IMPORTANTE: Ejecutar este script en orden secuencial
-- Hacer backup de la base de datos antes de ejecutar

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- PASO 1: MODIFICAR TABLA CARRERAS
-- =====================================================

PRINT 'Iniciando migración de tabla carreras...';

-- 1.1. Agregar columna bimestre_id con valor por defecto temporal
ALTER TABLE carreras 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 1.2. Actualizar datos existentes al bimestre activo actual
UPDATE carreras SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

-- 1.3. Agregar foreign key constraint
ALTER TABLE carreras 
ADD CONSTRAINT fk_carreras_bimestre 
FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 1.4. Eliminar índice único anterior
ALTER TABLE carreras DROP INDEX IF EXISTS codigo_plan;

-- 1.5. Crear nuevo índice único que incluye bimestre_id
ALTER TABLE carreras 
ADD UNIQUE KEY unique_carrera_bimestre (codigo_plan, bimestre_id);

-- 1.6. Remover valor por defecto (ya no necesario)
ALTER TABLE carreras ALTER COLUMN bimestre_id DROP DEFAULT;

PRINT 'Migración de tabla carreras completada.';

-- =====================================================
-- PASO 2: MODIFICAR TABLA ASIGNATURAS
-- =====================================================

PRINT 'Iniciando migración de tabla asignaturas...';

-- 2.1. Agregar columna bimestre_id con valor por defecto temporal
ALTER TABLE asignaturas 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 2.2. Actualizar datos existentes al bimestre activo actual
UPDATE asignaturas SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

-- 2.3. Agregar foreign key constraint
ALTER TABLE asignaturas 
ADD CONSTRAINT fk_asignaturas_bimestre 
FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 2.4. Eliminar índice único anterior
ALTER TABLE asignaturas DROP INDEX IF EXISTS unique_sigla_carrera;

-- 2.5. Crear nuevo índice único que incluye bimestre_id
ALTER TABLE asignaturas 
ADD UNIQUE KEY unique_asignatura_bimestre (carrera_id, sigla, bimestre_id);

-- 2.6. Remover valor por defecto (ya no necesario)
ALTER TABLE asignaturas ALTER COLUMN bimestre_id DROP DEFAULT;

PRINT 'Migración de tabla asignaturas completada.';

-- =====================================================
-- PASO 3: MODIFICAR TABLAS DE PERMISOS
-- =====================================================

PRINT 'Iniciando migración de tablas de permisos...';

-- 3.1. Agregar columna bimestre_id a usuario_permisos_carrera
ALTER TABLE usuario_permisos_carrera 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 3.2. Actualizar datos existentes al bimestre activo actual
UPDATE usuario_permisos_carrera SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

-- 3.3. Agregar foreign key constraint
ALTER TABLE usuario_permisos_carrera 
ADD CONSTRAINT fk_usuario_permisos_carrera_bimestre 
FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 3.4. Eliminar índice único anterior y crear nuevo
ALTER TABLE usuario_permisos_carrera DROP INDEX IF EXISTS unique_usuario_carrera;
ALTER TABLE usuario_permisos_carrera 
ADD UNIQUE KEY unique_usuario_carrera_bimestre (usuario_id, carrera_id, bimestre_id);

-- 3.5. Remover valor por defecto
ALTER TABLE usuario_permisos_carrera ALTER COLUMN bimestre_id DROP DEFAULT;

-- 3.6. Agregar columna bimestre_id a usuario_permisos_categoria
ALTER TABLE usuario_permisos_categoria 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 3.7. Actualizar datos existentes al bimestre activo actual
UPDATE usuario_permisos_categoria SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

-- 3.8. Agregar foreign key constraint
ALTER TABLE usuario_permisos_categoria 
ADD CONSTRAINT fk_usuario_permisos_categoria_bimestre 
FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 3.9. Eliminar índice único anterior y crear nuevo
ALTER TABLE usuario_permisos_categoria DROP INDEX IF EXISTS unique_usuario_categoria;
ALTER TABLE usuario_permisos_categoria 
ADD UNIQUE KEY unique_usuario_categoria_bimestre (usuario_id, categoria, bimestre_id);

-- 3.10. Remover valor por defecto
ALTER TABLE usuario_permisos_categoria ALTER COLUMN bimestre_id DROP DEFAULT;

-- 3.11. Agregar columna bimestre_id a permisos_pendientes
ALTER TABLE permisos_pendientes 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 3.12. Actualizar datos existentes al bimestre activo actual
UPDATE permisos_pendientes SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

-- 3.13. Agregar foreign key constraint
ALTER TABLE permisos_pendientes 
ADD CONSTRAINT fk_permisos_pendientes_bimestre 
FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 3.14. Remover valor por defecto
ALTER TABLE permisos_pendientes ALTER COLUMN bimestre_id DROP DEFAULT;

PRINT 'Migración de tablas de permisos completada.';

-- =====================================================
-- PASO 4: ACTUALIZAR VISTA DE PERMISOS
-- =====================================================

PRINT 'Actualizando vista usuario_asignaturas_permitidas...';

-- 4.1. Eliminar vista existente si existe
DROP VIEW IF EXISTS usuario_asignaturas_permitidas;

-- 4.2. Crear vista actualizada con soporte temporal completo
CREATE VIEW usuario_asignaturas_permitidas AS
SELECT DISTINCT 
    u.id AS usuario_id,
    u.email_institucional AS usuario_mail,
    a.id AS asignatura_id,
    a.sigla,
    a.nombre AS asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    a.bimestre_id,
    'CARRERA' AS tipo_permiso
FROM users u
JOIN usuario_permisos_carrera upc ON u.id = upc.usuario_id
JOIN carreras c ON upc.carrera_id = c.id AND upc.bimestre_id = c.bimestre_id  -- CLAVE: Filtro temporal en permisos
JOIN asignaturas a ON c.id = a.carrera_id AND c.bimestre_id = a.bimestre_id
WHERE u.is_active = true AND upc.activo = true AND a.activo = true

UNION

SELECT DISTINCT 
    u.id AS usuario_id,
    u.email_institucional AS usuario_mail,
    a.id AS asignatura_id,
    a.sigla,
    a.nombre AS asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    a.bimestre_id,
    'CATEGORIA' AS tipo_permiso
FROM users u
JOIN usuario_permisos_categoria upcat ON u.id = upcat.usuario_id
JOIN asignaturas a ON upcat.categoria = a.categoria_asignatura AND upcat.bimestre_id = a.bimestre_id  -- CLAVE: Filtro temporal en permisos
JOIN carreras c ON a.carrera_id = c.id AND a.bimestre_id = c.bimestre_id
WHERE u.is_active = true AND upcat.activo = true AND a.activo = true;

PRINT 'Vista usuario_asignaturas_permitidas actualizada.';

-- =====================================================
-- PASO 5: VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================

PRINT 'Ejecutando verificaciones post-migración...';

-- 5.1. Verificar que todas las tablas tienen bimestre_id
SELECT 
    'CARRERAS' as tabla,
    COUNT(*) as total_registros,
    COUNT(bimestre_id) as registros_con_bimestre,
    CASE 
        WHEN COUNT(*) = COUNT(bimestre_id) THEN 'OK' 
        ELSE 'ERROR: Registros sin bimestre_id' 
    END as estado
FROM carreras

UNION ALL

SELECT 
    'ASIGNATURAS' as tabla,
    COUNT(*) as total_registros,
    COUNT(bimestre_id) as registros_con_bimestre,
    CASE 
        WHEN COUNT(*) = COUNT(bimestre_id) THEN 'OK' 
        ELSE 'ERROR: Registros sin bimestre_id' 
    END as estado
FROM asignaturas

UNION ALL

SELECT 
    'USUARIO_PERMISOS_CARRERA' as tabla,
    COUNT(*) as total_registros,
    COUNT(bimestre_id) as registros_con_bimestre,
    CASE 
        WHEN COUNT(*) = COUNT(bimestre_id) THEN 'OK' 
        ELSE 'ERROR: Registros sin bimestre_id' 
    END as estado
FROM usuario_permisos_carrera

UNION ALL

SELECT 
    'USUARIO_PERMISOS_CATEGORIA' as tabla,
    COUNT(*) as total_registros,
    COUNT(bimestre_id) as registros_con_bimestre,
    CASE 
        WHEN COUNT(*) = COUNT(bimestre_id) THEN 'OK' 
        ELSE 'ERROR: Registros sin bimestre_id' 
    END as estado
FROM usuario_permisos_categoria

UNION ALL

SELECT 
    'PERMISOS_PENDIENTES' as tabla,
    COUNT(*) as total_registros,
    COUNT(bimestre_id) as registros_con_bimestre,
    CASE 
        WHEN COUNT(*) = COUNT(bimestre_id) THEN 'OK' 
        ELSE 'ERROR: Registros sin bimestre_id' 
    END as estado
FROM permisos_pendientes;

-- 5.2. Verificar integridad referencial
SELECT 
    'INTEGRIDAD_CARRERAS' as verificacion,
    COUNT(*) as registros_huerfanos
FROM carreras c
LEFT JOIN bimestres b ON c.bimestre_id = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD_ASIGNATURAS' as verificacion,
    COUNT(*) as registros_huerfanos
FROM asignaturas a
LEFT JOIN bimestres b ON a.bimestre_id = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD_PERMISOS_CARRERA' as verificacion,
    COUNT(*) as registros_huerfanos
FROM usuario_permisos_carrera upc
LEFT JOIN bimestres b ON upc.bimestre_id = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD_PERMISOS_CATEGORIA' as verificacion,
    COUNT(*) as registros_huerfanos
FROM usuario_permisos_categoria upcat
LEFT JOIN bimestres b ON upcat.bimestre_id = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 
    'INTEGRIDAD_PERMISOS_PENDIENTES' as verificacion,
    COUNT(*) as registros_huerfanos
FROM permisos_pendientes pp
LEFT JOIN bimestres b ON pp.bimestre_id = b.id
WHERE b.id IS NULL;

-- 5.3. Mostrar distribución por bimestre
SELECT 
    b.nombre as bimestre,
    COUNT(DISTINCT c.id) as carreras,
    COUNT(DISTINCT a.id) as asignaturas,
    COUNT(DISTINCT upc.id) as permisos_carrera,
    COUNT(DISTINCT upcat.id) as permisos_categoria,
    COUNT(DISTINCT pp.id) as permisos_pendientes
FROM bimestres b
LEFT JOIN carreras c ON b.id = c.bimestre_id
LEFT JOIN asignaturas a ON b.id = a.bimestre_id
LEFT JOIN usuario_permisos_carrera upc ON b.id = upc.bimestre_id
LEFT JOIN usuario_permisos_categoria upcat ON b.id = upcat.bimestre_id
LEFT JOIN permisos_pendientes pp ON b.id = pp.bimestre_id
GROUP BY b.id, b.nombre
ORDER BY b.id;

SET FOREIGN_KEY_CHECKS = 1;

PRINT 'Migración completada exitosamente.';
PRINT 'IMPORTANTE: Actualizar la lógica de carga para usar INSERT IGNORE en lugar de ON DUPLICATE KEY UPDATE';
PRINT 'IMPORTANTE: Actualizar consultas de la aplicación para incluir filtrado por bimestre_id';

-- =====================================================
-- NOTAS IMPORTANTES PARA DESARROLLADORES
-- =====================================================

/*
DESPUÉS DE EJECUTAR ESTA MIGRACIÓN, SE REQUIEREN LOS SIGUIENTES CAMBIOS EN EL CÓDIGO:

1. SCRIPTS DE CARGA DE DATOS FINALES:
   - Cambiar de DELETE + INSERT a INSERT IGNORE para preservar historial
   - Ejemplo para carreras:
     Antes: DELETE FROM carreras; INSERT INTO carreras...
     Después: INSERT IGNORE INTO carreras (codigo_plan, nombre_carrera, bimestre_id, ...) VALUES...
   - Aplicar el mismo cambio para asignaturas

2. GESTIÓN DE PERMISOS:
   - Los permisos ahora son específicos por bimestre
   - Al asignar permisos, especificar el bimestre_id correspondiente
   - Al cambiar permisos entre bimestres, crear nuevos registros en lugar de actualizar

3. CONSULTAS EN LA APLICACIÓN:
   - Todas las consultas a carreras, asignaturas y permisos deben filtrar por bimestre_id
   - Ejemplo:
     SELECT * FROM asignaturas WHERE carrera_id = ? AND bimestre_id = ?
     SELECT * FROM usuario_permisos_carrera WHERE usuario_id = ? AND bimestre_id = ?

4. JOINS EN CONSULTAS:
   - Los JOINs deben incluir bimestre_id para mantener consistencia temporal
   - Ejemplo:
     JOIN asignaturas a ON c.id = a.carrera_id AND c.bimestre_id = a.bimestre_id
     JOIN usuario_permisos_carrera upc ON u.id = upc.usuario_id AND upc.bimestre_id = ?

5. VISTA DE PERMISOS:
   - La vista usuario_asignaturas_permitidas incluye filtrado temporal completo
   - Las consultas que usen esta vista deben especificar el bimestre deseado

6. VALIDACIONES:
   - Verificar que todas las operaciones mantengan consistencia temporal
   - Asegurar que permisos y datos se consulten para el mismo bimestre
   - Validar que los cambios de permisos entre bimestres se manejen correctamente

7. CASOS ESPECIALES:
   - Usuario con Carrera X en Bimestre 1 y Carrera Y en Bimestre 2:
     * Debe ver solo asignaturas de Carrera X cuando consulte Bimestre 1
     * Debe ver solo asignaturas de Carrera Y cuando consulte Bimestre 2
   - Esto se logra mediante el filtrado temporal en permisos y datos
*/