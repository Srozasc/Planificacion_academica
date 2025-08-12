-- =============================================
-- Migración: 021-add-usuario-to-schedule-events.sql
-- Propósito: Agregar campo 'usuario' a la tabla schedule_events
-- Fecha: 2025-01-12
-- Descripción: Añade el campo 'usuario' varchar(15) para identificar
--              el usuario que creó o modificó el evento
-- =============================================

USE planificacion_academica;

-- Verificar estructura actual de la tabla schedule_events
SELECT 'ANTES - Estructura de schedule_events:' AS mensaje;
DESCRIBE schedule_events;

-- Agregar el campo 'usuario' a la tabla schedule_events
ALTER TABLE `schedule_events` 
ADD COLUMN `usuario` VARCHAR(15) NULL COMMENT 'Usuario que creó o modificó el evento' AFTER `active`;

-- Crear índice para mejorar el rendimiento de consultas por usuario
ALTER TABLE `schedule_events` 
ADD KEY `idx_schedule_events_usuario` (`usuario`);

-- Verificar que el campo se agregó correctamente
SELECT 'DESPUÉS - Estructura de schedule_events:' AS mensaje;
DESCRIBE schedule_events;

-- Mostrar los índices de la tabla
SELECT 'Índices de la tabla schedule_events:' AS mensaje;
SHOW INDEX FROM schedule_events;

-- Verificar registros existentes (el campo usuario será NULL inicialmente)
SELECT 
    'Registros existentes en schedule_events:' AS mensaje;
    
SELECT 
    id,
    title,
    teacher,
    subject,
    usuario,
    active,
    created_at
FROM schedule_events 
ORDER BY created_at DESC
LIMIT 5;

-- Mensaje de confirmación
SELECT 'Migración 021 completada: Campo usuario añadido a schedule_events' AS resultado;

/*
NOTAS IMPORTANTES:
1. El campo 'usuario' se agrega como VARCHAR(15) NULL
2. Se posiciona después del campo 'active' en la estructura
3. Se crea un índice para mejorar consultas por usuario
4. Los registros existentes tendrán usuario = NULL inicialmente
5. Se puede actualizar posteriormente con el usuario correspondiente

IMPACTO:
- Permite rastrear qué usuario creó o modificó cada evento
- Facilita auditoría y control de cambios
- No afecta la funcionalidad existente
- Los registros existentes mantienen su funcionalidad
*/