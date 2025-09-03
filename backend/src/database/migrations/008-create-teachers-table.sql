-- =============================================
-- Migración: 008-create-teachers-table.sql
-- Propósito: Crear tabla teachers con la estructura actualizada
-- Fecha: 2025-01-30
-- Descripción: Crea la tabla teachers con todos los campos requeridos
--              incluyendo los nuevos campos id_docente e id_bimestre
-- =============================================

USE planificacion_academica;

-- Eliminar tabla si existe para recrearla con la nueva estructura
DROP TABLE IF EXISTS `teachers`;

-- Crear tabla teachers con la nueva definición
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rut` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RUT del docente (formato: 12345678-9)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del docente',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email institucional del docente',
  `category_id` int DEFAULT NULL COMMENT 'ID de categoría docente (FK a payment_codes)',
  `contract_type_id` int DEFAULT NULL COMMENT 'ID tipo de contrato (FK a payment_codes)',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si el docente está activo',
  `can_coordinate` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si puede coordinar programas',
  `max_hours_per_week` int DEFAULT '40' COMMENT 'Máximo de horas semanales que puede dictar',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `id_docente` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_bimestre` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_teacher_bimestre` (`rut`,`id_bimestre`),
  KEY `idx_teachers_rut` (`rut`),
  KEY `idx_teachers_email` (`email`),
  KEY `idx_teachers_category` (`category_id`),
  KEY `idx_teachers_contract_type` (`contract_type_id`),
  KEY `idx_teachers_is_active` (`is_active`),
  KEY `idx_teachers_can_coordinate` (`can_coordinate`),
  KEY `rut` (`rut`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1544 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nómina de docentes con información personal, académica y contractual';

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla teachers creada exitosamente' AS status;
DESCRIBE teachers;

-- Mostrar índices creados
SHOW INDEX FROM teachers;