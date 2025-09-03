-- Migración 029: Cambiar tipo de dato de la columna 'horas' de DECIMAL(4,2) a INT
-- Fecha: 2025
-- Descripción: Modifica el tipo de dato de la columna 'horas' en la tabla schedule_events
--              de DECIMAL(4,2) a INT para eventos ADOL

USE planificacion_academica;

-- Cambiar el tipo de dato de la columna 'horas' de DECIMAL(4,2) a INT
ALTER TABLE schedule_events 
MODIFY COLUMN horas INT NULL COMMENT 'Cantidad de horas del evento (específico para eventos ADOL)';

-- Verificar que el cambio se aplicó correctamente
DESCRIBE schedule_events;

-- Comentario de finalización
-- La columna 'horas' ahora es de tipo INT en lugar de DECIMAL(4,2)
-- Esto permite almacenar solo números enteros para las horas de eventos ADOL