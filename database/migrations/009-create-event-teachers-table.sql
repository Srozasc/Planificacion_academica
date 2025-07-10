-- Migración para crear tabla de relación many-to-many entre eventos y docentes
-- Esta tabla permitirá asignar múltiples docentes a un evento

CREATE TABLE `event_teachers` (
    `id` int NOT NULL AUTO_INCREMENT,
    `event_id` int NOT NULL COMMENT 'ID del evento (FK a schedule_events)',
    `teacher_id` int NOT NULL COMMENT 'ID del docente (FK a teachers)',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_event_teacher` (`event_id`, `teacher_id`),
    KEY `idx_event_teachers_event_id` (`event_id`),
    KEY `idx_event_teachers_teacher_id` (`teacher_id`),
    CONSTRAINT `fk_event_teachers_event` FOREIGN KEY (`event_id`) REFERENCES `schedule_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_event_teachers_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de relación many-to-many entre eventos y docentes';

-- Migrar datos existentes del campo teacher al nuevo sistema
-- Solo si el campo teacher contiene un nombre válido
INSERT INTO `event_teachers` (`event_id`, `teacher_id`)
SELECT 
    se.id as event_id,
    t.id as teacher_id
FROM `schedule_events` se
INNER JOIN `teachers` t ON t.name = se.teacher
WHERE se.teacher IS NOT NULL 
  AND se.teacher != '' 
  AND se.active = 1;

-- Nota: El campo 'teacher' en schedule_events se mantendrá por compatibilidad
-- pero se marcará como deprecated en futuras versiones