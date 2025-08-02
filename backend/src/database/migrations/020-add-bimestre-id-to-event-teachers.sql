-- =============================================
-- Migración: 020-add-bimestre-id-to-event-teachers.sql
-- Propósito: Añadir campo id_bimestre a la tabla event_teachers
-- Fecha: 2025-01-30
-- Descripción: Agrega el campo id_bimestre para identificar el bimestre
--              al que pertenece la relación evento-docente
-- =============================================

USE planificacion_academica;

-- Agregar la columna id_bimestre a la tabla event_teachers
ALTER TABLE `event_teachers` 
ADD COLUMN `id_bimestre` int NULL COMMENT 'ID del bimestre (FK a bimestres)' AFTER `teacher_id`;

-- Crear índice para mejorar el rendimiento de consultas por bimestre
ALTER TABLE `event_teachers` 
ADD KEY `idx_event_teachers_bimestre_id` (`id_bimestre`);

-- Agregar foreign key constraint hacia la tabla bimestres
ALTER TABLE `event_teachers` 
ADD CONSTRAINT `fk_event_teachers_bimestre` 
    FOREIGN KEY (`id_bimestre`) 
    REFERENCES `bimestres` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Actualizar la clave única para incluir el bimestre
-- Primero eliminar la clave única existente
ALTER TABLE `event_teachers` 
DROP INDEX `unique_event_teacher`;

-- Crear nueva clave única que incluya el bimestre
ALTER TABLE `event_teachers` 
ADD UNIQUE KEY `unique_event_teacher_bimestre` (`event_id`, `teacher_id`, `id_bimestre`);

-- Nota: No es necesario migrar datos existentes ya que la tabla fue vaciada

-- Verificar los cambios realizados
SELECT 
    'event_teachers' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN id_bimestre IS NOT NULL THEN 1 END) as registros_con_bimestre,
    COUNT(CASE WHEN id_bimestre IS NULL THEN 1 END) as registros_sin_bimestre
FROM event_teachers;

-- Mostrar la nueva estructura de la tabla
DESCRIBE event_teachers;

-- Mostrar los índices de la tabla
SHOW INDEX FROM event_teachers;

SELECT 'Migración 020 completada: Campo id_bimestre añadido a event_teachers' AS status;