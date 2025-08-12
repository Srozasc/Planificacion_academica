-- =============================================
-- Migración: 019-update-dol-aprobados-unique-key.sql
-- Propósito: Actualizar clave única de dol_aprobados para incluir plan
-- Fecha: 2025-01-30
-- Descripción: Cambiar UNIQUE KEY unique_dol de (sigla, id_bimestre) 
--              a (sigla, id_bimestre, plan) para permitir múltiples
--              planes por sigla en el mismo bimestre
-- =============================================

USE planificacion_academica;

-- Paso 1: Verificar estructura actual
SELECT 'ANTES - Estructura de dol_aprobados:' AS mensaje;
DESCRIBE dol_aprobados;

-- Paso 2: Mostrar índices actuales
SELECT 'ANTES - Índices de dol_aprobados:' AS mensaje;
SHOW INDEX FROM dol_aprobados;

-- Paso 3: Verificar si existen registros que podrían causar conflicto
SELECT 'Verificando posibles duplicados que impedirían la nueva clave única:' AS mensaje;
SELECT 
    sigla, 
    id_bimestre, 
    plan,
    COUNT(*) as cantidad
FROM dol_aprobados 
GROUP BY sigla, id_bimestre, plan 
HAVING COUNT(*) > 1;

-- Paso 4: Eliminar la clave única actual
ALTER TABLE dol_aprobados DROP INDEX unique_dol;

-- Paso 5: Agregar la nueva clave única que incluye plan
ALTER TABLE dol_aprobados ADD UNIQUE KEY unique_dol (sigla, id_bimestre, plan);

-- Paso 6: Verificar que el cambio se aplicó correctamente
SELECT 'DESPUÉS - Estructura de dol_aprobados:' AS mensaje;
DESCRIBE dol_aprobados;

-- Paso 7: Mostrar índices después de la migración
SELECT 'DESPUÉS - Índices de dol_aprobados:' AS mensaje;
SHOW INDEX FROM dol_aprobados;

-- Paso 8: Verificar que no hay duplicados con la nueva clave
SELECT 'Verificando unicidad con la nueva clave (sigla, id_bimestre, plan):' AS mensaje;
SELECT 
    sigla, 
    id_bimestre, 
    plan,
    COUNT(*) as cantidad
FROM dol_aprobados 
GROUP BY sigla, id_bimestre, plan 
HAVING COUNT(*) > 1;

-- Mensaje de confirmación
SELECT 'Migración completada: Clave única de dol_aprobados actualizada a (sigla, id_bimestre, plan)' AS resultado;

/*
NOTAS IMPORTANTES:
1. Esta migración cambia la clave única de dol_aprobados
2. Antes: UNIQUE KEY unique_dol (sigla, id_bimestre)
3. Después: UNIQUE KEY unique_dol (sigla, id_bimestre, plan)
4. Esto permite que la misma sigla pueda existir en diferentes planes dentro del mismo bimestre
5. Mantiene la restricción de que no puede haber duplicados exactos (sigla + bimestre + plan)

IMPACTO:
- Permite mayor flexibilidad en los datos aprobados
- Evita conflictos cuando una misma sigla existe en múltiples planes
- Mantiene la integridad referencial con bimestres
- Alineado con la estructura de staging_dol que ya tiene clave primaria compuesta (sigla, plan)
- Consistente con la corrección realizada en el procesamiento de datos DOL
*/