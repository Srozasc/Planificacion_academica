-- Migración 028: Modificar índice único de la tabla teachers
-- Fecha: 2025
-- Descripción: Cambia el índice único de (rut, id_bimestre) a (id_docente, id_bimestre)

-- Eliminar el índice único existente
ALTER TABLE teachers DROP INDEX unique_teacher_bimestre;

-- Crear el nuevo índice único con id_docente en lugar de rut
ALTER TABLE teachers ADD UNIQUE KEY `unique_teacher_bimestre` (`id_docente`,`id_bimestre`);

-- Comentario de finalización
-- El índice único ahora usa id_docente en lugar de rut para garantizar
-- la unicidad de docentes por bimestre usando el identificador interno