-- =============================================
-- Migración: Actualizar clave primaria de staging_dol
-- Archivo: 015-update-staging-dol-primary-key.sql
-- Fecha: 2025-01-30
-- Descripción: Cambiar PRIMARY KEY de (sigla) a (sigla, plan)
-- =============================================

USE planificacion_academica;

-- Paso 1: Verificar estructura actual
SELECT 'ANTES - Estructura de staging_dol:' AS mensaje;
DESCRIBE staging_dol;

-- Paso 2: Mostrar índices actuales
SELECT 'ANTES - Índices de staging_dol:' AS mensaje;
SHOW INDEX FROM staging_dol;

-- Paso 3: Eliminar la clave primaria actual (solo sigla)
ALTER TABLE staging_dol DROP PRIMARY KEY;

-- Paso 4: Agregar la nueva clave primaria compuesta (sigla + plan)
ALTER TABLE staging_dol ADD PRIMARY KEY (sigla, plan);

-- Paso 5: Verificar que el cambio se aplicó correctamente
SELECT 'DESPUÉS - Estructura de staging_dol:' AS mensaje;
DESCRIBE staging_dol;

-- Paso 6: Mostrar índices después de la migración
SELECT 'DESPUÉS - Índices de staging_dol:' AS mensaje;
SHOW INDEX FROM staging_dol;

-- Mensaje de confirmación
SELECT 'Migración completada: Clave primaria de staging_dol actualizada a (sigla, plan)' AS resultado;

/*
NOTAS IMPORTANTES:
1. Esta migración cambia la clave primaria de staging_dol
2. Antes: PRIMARY KEY (sigla)
3. Después: PRIMARY KEY (sigla, plan)
4. Esto permite que la misma sigla pueda existir en diferentes planes
5. El índice IX_staging_dol_sigla se mantiene para consultas por sigla
6. La restricción de clave foránea FK_staging_dol_bimestre se mantiene

IMPACTO:
- Permite mayor flexibilidad en los datos
- Evita conflictos cuando una misma sigla existe en múltiples planes
- Mantiene la integridad referencial con bimestres
- No afecta las consultas existentes que usen sigla únicamente
*/