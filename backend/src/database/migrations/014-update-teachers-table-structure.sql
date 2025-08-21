-- Migración para actualizar la estructura de la tabla teachers
-- Elimina campos prescindibles y agrega nuevos campos requeridos

-- Primero, eliminar los campos que ya no se necesitan
ALTER TABLE `teachers` 
    DROP COLUMN IF EXISTS `phone`,
    DROP COLUMN IF EXISTS `address`,
    DROP COLUMN IF EXISTS `academic_degree`,
    DROP COLUMN IF EXISTS `specialization`,
    DROP COLUMN IF EXISTS `university`,
    DROP COLUMN IF EXISTS `hire_date`,
    DROP COLUMN IF EXISTS `contract_hours`,
    DROP COLUMN IF EXISTS `salary_base`;

-- Eliminar índices que ya no son necesarios
DROP INDEX IF EXISTS `idx_teachers_hire_date` ON `teachers`;

-- Eliminar la restricción UNIQUE del email ya que la nueva estructura no la requiere
DROP INDEX IF EXISTS `email` ON `teachers`;

-- Modificar el campo email para que sea NOT NULL
ALTER TABLE `teachers` MODIFY COLUMN `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email institucional del docente';

-- Agregar los nuevos campos
ALTER TABLE `teachers` 
    ADD COLUMN `id_docente` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `deleted_at`,
    ADD COLUMN `id_bimestre` int DEFAULT NULL AFTER `id_docente`;

-- Recrear los índices según la nueva estructura
CREATE INDEX `idx_teachers_rut` ON `teachers` (`rut`);
CREATE INDEX `idx_teachers_email` ON `teachers` (`email`);
CREATE INDEX `idx_teachers_category` ON `teachers` (`category_id`);
CREATE INDEX `idx_teachers_contract_type` ON `teachers` (`contract_type_id`);
CREATE INDEX `idx_teachers_is_active` ON `teachers` (`is_active`);
CREATE INDEX `idx_teachers_can_coordinate` ON `teachers` (`can_coordinate`);
CREATE INDEX `rut` ON `teachers` (`rut`) USING BTREE;

-- Actualizar el comentario de la tabla
ALTER TABLE `teachers` COMMENT = 'Nómina de docentes con información personal, académica y contractual';