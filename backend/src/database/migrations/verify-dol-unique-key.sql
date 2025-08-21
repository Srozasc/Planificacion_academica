-- Verificar la nueva clave única de dol_aprobados
USE planificacion_academica;

-- Mostrar la estructura de la tabla
SELECT 'Estructura actual de dol_aprobados:' AS mensaje;
DESCRIBE dol_aprobados;

-- Mostrar específicamente la clave única
SELECT 'Clave única actual:' AS mensaje;
SHOW INDEX FROM dol_aprobados WHERE Key_name = 'unique_dol';

-- Verificar que no hay duplicados con la nueva clave
SELECT 'Verificando unicidad (sigla, id_bimestre, plan):' AS mensaje;
SELECT 
    sigla, 
    id_bimestre, 
    plan,
    COUNT(*) as cantidad
FROM dol_aprobados 
GROUP BY sigla, id_bimestre, plan 
HAVING COUNT(*) > 1;

SELECT 'Verificación completada' AS resultado;