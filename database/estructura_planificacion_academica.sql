-- MySQL dump 10.13  Distrib 8.4.5, for Win64 (x86_64)
--
-- Host: localhost    Database: planificacion_academica
-- ------------------------------------------------------
-- Server version	8.4.5

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_structures`
--

DROP TABLE IF EXISTS `academic_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_structures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo ├║nico de la asignatura/plan',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de la asignatura o plan',
  `credits` int DEFAULT NULL COMMENT 'N├║mero de cr├®ditos de la asignatura',
  `plan_id` int DEFAULT NULL COMMENT 'ID del plan de estudios al que pertenece',
  `type` enum('subject','plan','module') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'subject' COMMENT 'Tipo: asignatura, plan o m├│dulo',
  `semester` int DEFAULT NULL COMMENT 'Semestre recomendado (1-10)',
  `prerequisites` text COLLATE utf8mb4_unicode_ci COMMENT 'C├│digos de asignaturas prerrequisito separados por coma',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Descripci├│n detallada',
  `hours_per_week` int DEFAULT NULL COMMENT 'Horas acad├®micas por semana',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Si est├í activo en el sistema',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_academic_structures_code` (`code`),
  KEY `idx_academic_structures_plan_id` (`plan_id`),
  KEY `idx_academic_structures_type` (`type`),
  KEY `idx_academic_structures_is_active` (`is_active`),
  KEY `idx_academic_structures_semester` (`semester`),
  CONSTRAINT `academic_structures_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `academic_structures` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bimestres`
--

DROP TABLE IF EXISTS `bimestres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bimestres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date NOT NULL,
  `anoAcademico` int NOT NULL,
  `numeroBimestre` int NOT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `conexion_test`
--

DROP TABLE IF EXISTS `conexion_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conexion_test` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mensaje` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuration`
--

DROP TABLE IF EXISTS `configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuration` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID ├║nico de la configuraci├│n',
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clave ├║nica de configuraci├│n',
  `config_value` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Valor de la configuraci├│n',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Descripci├│n de qu├® hace esta configuraci├│n',
  `value_type` enum('string','number','boolean','json','date','time') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string' COMMENT 'Tipo de dato del valor',
  `is_editable` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si la configuraci├│n puede editarse desde la UI',
  `is_system` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si es una configuraci├│n cr├¡tica del sistema',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general' COMMENT 'Categor├¡a de la configuraci├│n',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creaci├│n',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de ├║ltima actualizaci├│n',
  `updated_by` int DEFAULT NULL COMMENT 'ID del usuario que actualiz├│ la configuraci├│n',
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_configuration_category` (`category`),
  KEY `idx_configuration_editable` (`is_editable`),
  KEY `idx_configuration_system` (`is_system`),
  CONSTRAINT `configuration_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraciones globales del sistema de planificaci├│n acad├®mica';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_reports_data`
--

DROP TABLE IF EXISTS `course_reports_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_reports_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_structure_id` int NOT NULL COMMENT 'ID de la estructura acad├®mica (asignatura)',
  `student_count` int NOT NULL DEFAULT '0' COMMENT 'Cantidad de estudiantes cursables',
  `term` enum('1','2','anual','intensivo') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Semestre o per├¡odo acad├®mico',
  `year` year NOT NULL COMMENT 'A├▒o acad├®mico',
  `section` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Secci├│n de la asignatura (A, B, C, etc.)',
  `modality` enum('presencial','online','mixta') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'presencial' COMMENT 'Modalidad de la asignatura',
  `enrolled_count` int DEFAULT NULL COMMENT 'Estudiantes matriculados inicialmente',
  `passed_count` int DEFAULT NULL COMMENT 'Estudiantes que aprobaron',
  `failed_count` int DEFAULT NULL COMMENT 'Estudiantes que reprobaron',
  `withdrawn_count` int DEFAULT NULL COMMENT 'Estudiantes que se retiraron',
  `weekly_hours` decimal(4,2) DEFAULT NULL COMMENT 'Horas semanales de la asignatura',
  `total_hours` decimal(6,2) DEFAULT NULL COMMENT 'Total de horas del per├¡odo',
  `is_validated` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si los datos han sido validados',
  `validated_by` int DEFAULT NULL COMMENT 'ID del usuario que valid├│',
  `validated_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de validaci├│n',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Observaciones adicionales del reporte',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_reports_unique` (`academic_structure_id`,`year`,`term`,`section`),
  KEY `validated_by` (`validated_by`),
  KEY `idx_course_reports_academic_structure` (`academic_structure_id`),
  KEY `idx_course_reports_term_year` (`term`,`year`),
  KEY `idx_course_reports_year` (`year`),
  KEY `idx_course_reports_modality` (`modality`),
  KEY `idx_course_reports_validation` (`is_validated`,`validated_at`),
  KEY `idx_course_reports_deleted` (`deleted_at`),
  KEY `idx_course_reports_structure_period` (`academic_structure_id`,`year`,`term`),
  CONSTRAINT `course_reports_data_ibfk_1` FOREIGN KEY (`academic_structure_id`) REFERENCES `academic_structures` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `course_reports_data_ibfk_2` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_counts_consistency` CHECK (((`enrolled_count` is null) or ((`passed_count` is null) and (`failed_count` is null) and (`withdrawn_count` is null)) or (`enrolled_count` >= ((coalesce(`passed_count`,0) + coalesce(`failed_count`,0)) + coalesce(`withdrawn_count`,0))))),
  CONSTRAINT `chk_enrolled_count_positive` CHECK (((`enrolled_count` is null) or (`enrolled_count` >= 0))),
  CONSTRAINT `chk_failed_count_positive` CHECK (((`failed_count` is null) or (`failed_count` >= 0))),
  CONSTRAINT `chk_passed_count_positive` CHECK (((`passed_count` is null) or (`passed_count` >= 0))),
  CONSTRAINT `chk_student_count_positive` CHECK ((`student_count` >= 0)),
  CONSTRAINT `chk_total_hours_positive` CHECK (((`total_hours` is null) or (`total_hours` > 0))),
  CONSTRAINT `chk_weekly_hours_positive` CHECK (((`weekly_hours` is null) or (`weekly_hours` > 0))),
  CONSTRAINT `chk_withdrawn_count_positive` CHECK (((`withdrawn_count` is null) or (`withdrawn_count` >= 0))),
  CONSTRAINT `chk_year_valid` CHECK (((`year` >= 2020) and (`year` <= 2050)))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos de reportes de cursables por asignatura y per├¡odo acad├®mico';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_statuses`
--

DROP TABLE IF EXISTS `event_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_statuses` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID ├║nico del estado',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del estado (Borrador, En Revisi├│n, etc.)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Descripci├│n detallada del estado',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si el estado est├í activo para usar',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT 'Orden de visualizaci├│n',
  `color_hex` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Color hexadecimal para representar el estado (#RRGGBB)',
  `can_edit` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si los eventos en este estado pueden editarse',
  `can_delete` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si los eventos en este estado pueden eliminarse',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creaci├│n',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de ├║ltima actualizaci├│n',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_event_statuses_active` (`is_active`),
  KEY `idx_event_statuses_sort` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Estados disponibles para eventos de programaci├│n acad├®mica';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_teachers`
--

DROP TABLE IF EXISTS `event_teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL COMMENT 'ID del evento (FK a schedule_events)',
  `teacher_id` int NOT NULL COMMENT 'ID del docente (FK a teachers)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_teacher` (`event_id`,`teacher_id`),
  KEY `idx_event_teachers_event_id` (`event_id`),
  KEY `idx_event_teachers_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_event_teachers_event` FOREIGN KEY (`event_id`) REFERENCES `schedule_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_teachers_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de relaci├│n many-to-many entre eventos y docentes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_codes`
--

DROP TABLE IF EXISTS `payment_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'C├│digo ├║nico de pago (Ej: DOC1, ASI2, etc.)',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripci├│n del c├│digo de pago',
  `factor` decimal(8,4) NOT NULL DEFAULT '1.0000' COMMENT 'Factor multiplicador para c├ílculos salariales',
  `base_amount` decimal(10,2) DEFAULT NULL COMMENT 'Monto base en pesos chilenos',
  `category` enum('docente','administrativo','otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'docente' COMMENT 'Categor├¡a del c├│digo',
  `type` enum('categoria','contrato','bono','descuento','hora') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de c├│digo de pago',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si el c├│digo est├í activo',
  `requires_hours` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si requiere especificar horas',
  `is_taxable` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si est├í afecto a impuestos',
  `valid_from` date DEFAULT NULL COMMENT 'Fecha desde la cual es v├ílido',
  `valid_until` date DEFAULT NULL COMMENT 'Fecha hasta la cual es v├ílido',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_name` (`code_name`),
  KEY `idx_payment_codes_code_name` (`code_name`),
  KEY `idx_payment_codes_category` (`category`),
  KEY `idx_payment_codes_type` (`type`),
  KEY `idx_payment_codes_is_active` (`is_active`),
  KEY `idx_payment_codes_validity` (`valid_from`,`valid_until`),
  CONSTRAINT `chk_base_amount_positive` CHECK (((`base_amount` is null) or (`base_amount` >= 0))),
  CONSTRAINT `chk_factor_positive` CHECK ((`factor` > 0)),
  CONSTRAINT `chk_valid_dates` CHECK (((`valid_until` is null) or (`valid_from` is null) or (`valid_until` >= `valid_from`)))
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='C├│digos de pago con factores para c├ílculos salariales y categorizaci├│n';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de permisos del sistema para control granular de acceso';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_role` (`role_id`),
  KEY `idx_permission` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla pivot que relaciona roles con permisos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schedule_events`
--

DROP TABLE IF EXISTS `schedule_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `teacher` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `students` int DEFAULT NULL,
  `background_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bimestre_id` int DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_events_bimestre` (`bimestre_id`),
  CONSTRAINT `fk_events_bimestre` FOREIGN KEY (`bimestre_id`) REFERENCES `bimestres` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_schedule_events_before_insert` BEFORE INSERT ON `schedule_events` FOR EACH ROW BEGIN

    -- Validar que la fecha de fin sea posterior al inicio

    IF NEW.end_date <= NEW.start_date THEN

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de fin debe ser posterior a la fecha de inicio';

    END IF;

    

    -- Verificar conflictos de sala solo si se especifica una sala y no est├í vac├¡a

    IF NEW.room IS NOT NULL AND NEW.room != '' THEN

        -- Usamos la funci├│n que creamos antes

        SET @conflict_count = fn_CheckRoomConflict(NEW.room, NEW.start_date, NEW.end_date, NULL);

        

        IF @conflict_count > 0 THEN

            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflicto de horario: La sala ya est├í ocupada en ese horario';

        END IF;

    END IF;

    

    -- Establecer valores por defecto para las fechas de auditor├¡a

    IF NEW.created_at IS NULL THEN

        SET NEW.created_at = NOW();

    END IF;

    

    IF NEW.updated_at IS NULL THEN

        SET NEW.updated_at = NOW();

    END IF;

end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_schedule_events_before_update` BEFORE UPDATE ON `schedule_events` FOR EACH ROW BEGIN

    DECLARE conflict_count INT DEFAULT 0;

    

    -- Validar que la fecha de fin sea posterior al inicio

    IF NEW.end_date <= NEW.start_date THEN

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de fin debe ser posterior a la fecha de inicio';

    END IF;

    

    -- Verificar conflictos de sala solo si se especifica una sala y hay cambios relevantes

    IF NEW.room IS NOT NULL AND NEW.room != '' AND (

        NEW.room != OLD.room OR 

        NEW.start_date != OLD.start_date OR 

        NEW.end_date != OLD.end_date

    ) THEN

        SET conflict_count = fn_CheckRoomConflict(NEW.room, NEW.start_date, NEW.end_date, NEW.id);

        

        IF conflict_count > 0 THEN

            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conflicto de horario: La sala ya est├í ocupada en ese horario';

        END IF;

    END IF;

    

    -- Actualizar timestamp

    SET NEW.updated_at = NOW();

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `sp_debug_log`
--

DROP TABLE IF EXISTS `sp_debug_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sp_debug_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `log_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `procedure_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'sp_LoadAcademicStructure',
  `sqlstate_val` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `errno_val` int DEFAULT NULL,
  `message_text_val` text COLLATE utf8mb4_unicode_ci,
  `input_json` longtext COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rut` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'RUT del docente (formato: 12345678-9)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del docente',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email institucional del docente',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tel├®fono de contacto',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT 'Direcci├│n de residencia',
  `academic_degree` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'T├¡tulo acad├®mico (Ej: Mag├¡ster, Doctor)',
  `specialization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '├ürea de especializaci├│n',
  `university` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Universidad de origen del t├¡tulo',
  `category_id` int DEFAULT NULL COMMENT 'ID de categor├¡a docente (FK a payment_codes)',
  `contract_type_id` int DEFAULT NULL COMMENT 'ID tipo de contrato (FK a payment_codes)',
  `hire_date` date DEFAULT NULL COMMENT 'Fecha de contrataci├│n',
  `contract_hours` int DEFAULT NULL COMMENT 'Horas contractuales por semana',
  `salary_base` decimal(10,2) DEFAULT NULL COMMENT 'Salario base mensual',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Si el docente est├í activo',
  `can_coordinate` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Si puede coordinar programas',
  `max_hours_per_week` int DEFAULT '40' COMMENT 'M├íximo de horas semanales que puede dictar',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rut` (`rut`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_teachers_rut` (`rut`),
  KEY `idx_teachers_email` (`email`),
  KEY `idx_teachers_category` (`category_id`),
  KEY `idx_teachers_contract_type` (`contract_type_id`),
  KEY `idx_teachers_is_active` (`is_active`),
  KEY `idx_teachers_can_coordinate` (`can_coordinate`),
  KEY `idx_teachers_hire_date` (`hire_date`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='N├│mina de docentes con informaci├│n personal, acad├®mica y contractual';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email_institucional` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `role_expires_at` datetime DEFAULT NULL COMMENT 'Fecha y hora de expiraciÔö£Ôöén del rol temporal',
  `previous_role_id` int DEFAULT NULL COMMENT 'ID del rol anterior antes de asignar rol temporal',
  PRIMARY KEY (`id`),
  KEY `idx_users_role_expires_at` (`role_expires_at`),
  KEY `idx_users_previous_role_id` (`previous_role_id`),
  CONSTRAINT `fk_users_previous_role` FOREIGN KEY (`previous_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de usuarios con soporte para roles temporales';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_schedule_events_active`
--

DROP TABLE IF EXISTS `v_schedule_events_active`;
/*!50001 DROP VIEW IF EXISTS `v_schedule_events_active`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_schedule_events_active` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `description`,
 1 AS `start_date`,
 1 AS `end_date`,
 1 AS `teacher`,
 1 AS `subject`,
 1 AS `room`,
 1 AS `students`,
 1 AS `background_color`,
 1 AS `bimestre_id`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `bimestre_nombre`,
 1 AS `bimestre_ano_academico`,
 1 AS `bimestre_fecha_inicio`,
 1 AS `bimestre_fecha_fin`,
 1 AS `duration_minutes`,
 1 AS `event_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'planificacion_academica'
--

--
-- Dumping routines for database 'planificacion_academica'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_CheckRoomConflict` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` FUNCTION `fn_CheckRoomConflict`(
    p_room VARCHAR(50),
    p_start_date DATETIME,
    p_end_date DATETIME,
    p_exclude_event_id INT
) RETURNS int
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    SELECT COUNT(*)
    INTO conflict_count
    FROM schedule_events
    WHERE 
        room = p_room
        AND active = TRUE
        AND (p_exclude_event_id IS NULL OR id != p_exclude_event_id)
        AND (
            (start_date < p_end_date AND end_date > p_start_date)
        );
    
    RETURN conflict_count;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_AuthenticateUser` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_AuthenticateUser`(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    OUT o_user_id INT,
    OUT o_role_name VARCHAR(50),
    OUT o_user_name VARCHAR(255),
    OUT o_status_code VARCHAR(50)
)
BEGIN
    DECLARE user_count INT DEFAULT 0;
    DECLARE user_active INT DEFAULT 0;
    DECLARE stored_hash VARCHAR(255) DEFAULT '';
    
    SET o_user_id = NULL;
    SET o_role_name = NULL;
    SET o_user_name = NULL;
    SET o_status_code = 'ERROR';
    
    SELECT COUNT(*) INTO user_count 
    FROM users 
    WHERE email_institucional = p_email;
    
    IF user_count = 0 THEN
        SET o_status_code = 'USER_NOT_FOUND';
    ELSE
        SELECT 
            u.id, 
            u.name, 
            u.is_active, 
            u.password_hash,
            r.name as role_name
        INTO 
            o_user_id, 
            o_user_name, 
            user_active, 
            stored_hash,
            o_role_name
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.email_institucional = p_email;
        
        IF user_active = 0 THEN
            SET o_status_code = 'ACCOUNT_DISABLED';
            SET o_user_id = NULL;
            SET o_role_name = NULL;
            SET o_user_name = NULL;
        ELSE
            IF stored_hash = p_password_hash THEN
                SET o_status_code = 'SUCCESS';
            ELSE
                SET o_status_code = 'INVALID_CREDENTIALS';
                SET o_user_id = NULL;
                SET o_role_name = NULL;
                SET o_user_name = NULL;
            END IF;
        END IF;
    END IF;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_CreateUser` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_CreateUser`(
    IN p_email_institucional VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_role_id INT,
    OUT o_user_id INT,
    OUT o_status_code VARCHAR(50)
)
BEGIN
    DECLARE email_count INT DEFAULT 0;
    DECLARE role_count INT DEFAULT 0;
    
    SET o_user_id = NULL;
    SET o_status_code = 'ERROR';
    
    SELECT COUNT(*) INTO email_count 
    FROM users 
    WHERE email_institucional = p_email_institucional;
    
    SELECT COUNT(*) INTO role_count 
    FROM roles 
    WHERE id = p_role_id;
    
    IF email_count > 0 THEN
        SET o_status_code = 'EMAIL_EXISTS';
    ELSEIF role_count = 0 THEN
        SET o_status_code = 'INVALID_ROLE';
    ELSE
        INSERT INTO users (email_institucional, password_hash, name, role_id, is_active)
        VALUES (p_email_institucional, p_password_hash, p_name, p_role_id, TRUE);
        
        SET o_user_id = LAST_INSERT_ID();
        SET o_status_code = 'SUCCESS';
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_DeleteScheduleEvent` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_DeleteScheduleEvent`(
    IN p_event_id INT,
    IN p_user_id INT,
    IN p_logical_delete BOOLEAN,
    OUT o_status_code VARCHAR(50),
    OUT o_error_message TEXT
)
BEGIN
    DECLARE v_event_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos durante la eliminaci??n';
    END;

    START TRANSACTION;

    -- Inicializar variables de salida
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;

    -- 1. VERIFICAR EXISTENCIA DEL EVENTO
    SELECT COUNT(*) INTO v_event_exists
    FROM schedule_events
    WHERE id = p_event_id AND is_active = TRUE;

    IF v_event_exists = 0 THEN
        SET o_status_code = 'NOT_FOUND';
        SET o_error_message = 'El evento especificado no existe o ya fue eliminado';
        ROLLBACK;
    ELSE
        -- 2. REALIZAR ELIMINACI??N
        IF p_logical_delete THEN
            -- Eliminaci??n l??gica
            UPDATE schedule_events
            SET is_active = FALSE,
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_event_id;
            
            SET o_status_code = 'SUCCESS';
            SET o_error_message = 'Evento eliminado l??gicamente';
        ELSE
            -- Eliminaci??n f??sica
            DELETE FROM schedule_events WHERE id = p_event_id;
            
            SET o_status_code = 'SUCCESS';
            SET o_error_message = 'Evento eliminado f??sicamente';
        END IF;
        
        COMMIT;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_GetScheduleEvents` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_GetScheduleEvents`(
    IN p_area_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_teacher_id INT,
    IN p_status_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    SELECT 
        se.id,
        se.academic_structure_id,
        se.teacher_id,
        se.area_id,
        se.start_datetime,
        se.end_datetime,
        se.day_of_week,
        se.classroom,
        se.vacancies,
        se.max_capacity,
        se.status_id,
        se.approval_comment,
        se.approved_by,
        se.approved_at,
        se.weekly_hours,
        se.academic_period,
        se.section,
        se.is_recurring,
        se.recurrence_end_date,
        se.is_active,
        se.conflicts_checked,
        se.validation_notes,
        se.created_by_user_id,
        se.created_at,
        se.updated_at,
        
        ast.name as subject_name,
        ast.code as subject_code,
        ast.semester,
        ast.credits,
        
        t.name as teacher_name,
        t.email as teacher_email,
        t.phone as teacher_phone,
        
        es.name as status_name,
        es.description as status_description,
        es.color_hex as status_color,
        es.can_edit,
        es.can_delete,
        
        u.name as created_by_name,
        u.email_institucional as created_by_email,
        
        ua.name as approved_by_name,
        ua.email_institucional as approved_by_email
        
    FROM schedule_events se
    LEFT JOIN academic_structures ast ON se.academic_structure_id = ast.id
    LEFT JOIN teachers t ON se.teacher_id = t.id
    LEFT JOIN event_statuses es ON se.status_id = es.id
    LEFT JOIN users u ON se.created_by_user_id = u.id
    LEFT JOIN users ua ON se.approved_by = ua.id
    
    WHERE 1=1
      AND (p_area_id IS NULL OR se.area_id = p_area_id)
      AND (p_start_date IS NULL OR DATE(se.start_datetime) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(se.end_datetime) <= p_end_date)
      AND (p_teacher_id IS NULL OR se.teacher_id = p_teacher_id)
      AND (p_status_id IS NULL OR se.status_id = p_status_id)
      AND se.is_active = TRUE
    
    ORDER BY se.start_datetime ASC, ast.name, t.name;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_GetUserPermissions` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_GetUserPermissions`(
    IN p_user_id INT
)
BEGIN
    SELECT 
        p.name as permission_name,
        p.description as permission_description
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN role_permissions rp ON r.id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id
    AND u.is_active = TRUE
    ORDER BY p.name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_LoadAcademicStructure` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LoadAcademicStructure`(
    IN p_json_data LONGTEXT,
    IN p_user_id INT,
    IN p_update_mode VARCHAR(20),
    OUT p_result_json LONGTEXT
)
proc_main: BEGIN
    -- Variables de control
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_success_count INT DEFAULT 0;
    DECLARE v_update_count INT DEFAULT 0;
    DECLARE v_insert_count INT DEFAULT 0;
    DECLARE v_skip_count INT DEFAULT 0;
    
    -- Variables para procesamiento de cada registro
    DECLARE v_row_index INT DEFAULT 0;
    DECLARE v_code VARCHAR(20);
    DECLARE v_name VARCHAR(255);
    DECLARE v_credits INT;
    DECLARE v_plan_id INT;
    DECLARE v_plan_code VARCHAR(20);
    DECLARE v_type VARCHAR(20);
    DECLARE v_semester INT;
    DECLARE v_prerequisites TEXT;
    DECLARE v_description TEXT;
    DECLARE v_hours_per_week INT;
    DECLARE v_is_active BOOLEAN;
    
    -- Variables de validaci??n
    DECLARE v_existing_id INT DEFAULT NULL;
    DECLARE v_plan_id_resolved INT DEFAULT NULL;
    DECLARE v_error_message TEXT DEFAULT '';
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;

    -- Variables para manejo de errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        
        -- ROLLBACK simplificado
        ROLLBACK;

        -- Insertar en la tabla de depuraci??n
        INSERT IGNORE INTO sp_debug_log (procedure_name, sqlstate_val, errno_val, message_text_val, input_json, notes)
        VALUES ('sp_LoadAcademicStructure', @sqlstate, @errno, @text, p_json_data, 'Error capturado en EXIT HANDLER');
        
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Error SQL durante el procesamiento. Ver sp_debug_log para detalles.',
            'error_code', @errno,
            'error_message', @text,
            'processed_rows', v_row_index 
        );
    END;
    
    -- Tabla temporal para almacenar errores de validaci??n
    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;
    CREATE TEMPORARY TABLE temp_validation_errors (
        row_index INT,
        field_name VARCHAR(50),
        error_type VARCHAR(50),
        error_message TEXT,
        record_data JSON
    );    
    
    -- Intento de log inicial, DESPU??S de declarar variables y ANTES de declarar el handler
    -- Esto es para verificar si el SP se inicia y puede escribir en la tabla de log.
    -- Usar INSERT IGNORE para m??xima robustez.
    INSERT IGNORE INTO sp_debug_log (procedure_name, notes, input_json)
    VALUES ('sp_LoadAcademicStructure', 'Procedure execution started (after declares)', p_json_data);
    
    -- Validaciones iniciales (antes de la transacci??n principal)
    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'JSON de entrada inv??lido o vac??o'
        );
        INSERT IGNORE INTO sp_debug_log (procedure_name, sqlstate_val, errno_val, message_text_val, input_json, notes)
        VALUES ('sp_LoadAcademicStructure', 'PROC_ERR', -1, 'JSON de entrada inv??lido o vac??o', p_json_data, 'Validaci??n inicial JSON fallida');
        LEAVE proc_main;
    END IF;
    
    IF p_update_mode NOT IN ('INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT') THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Modo de actualizaci??n inv??lido. Debe ser: INSERT_ONLY, UPDATE_ONLY o UPSERT'
        );
        INSERT IGNORE INTO sp_debug_log (procedure_name, sqlstate_val, errno_val, message_text_val, input_json, notes)
        VALUES ('sp_LoadAcademicStructure', 'PROC_ERR', -2, 'Modo de actualizaci??n inv??lido', p_json_data, CONCAT('Modo: ', p_update_mode));
        LEAVE proc_main;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('Usuario con ID ', p_user_id, ' no encontrado')
        );
        INSERT IGNORE INTO sp_debug_log (procedure_name, sqlstate_val, errno_val, message_text_val, input_json, notes)
        VALUES ('sp_LoadAcademicStructure', 'PROC_ERR', -3, CONCAT('Usuario con ID ', p_user_id, ' no encontrado'), p_json_data, 'Validaci??n de usuario fallida');
        LEAVE proc_main;
    END IF;
    
    -- Iniciar transacci??n DESPU??S de validaciones iniciales que no requieren rollback de esta transacci??n
    START TRANSACTION;
    
    -- Procesamiento principal
    BEGIN
        SET @array_length = JSON_LENGTH(p_json_data);
        
        WHILE v_row_index < @array_length DO
            SET @current_record = JSON_EXTRACT(p_json_data, CONCAT('$[', v_row_index, ']'));
            
            SET v_validation_passed = TRUE;
            SET v_error_message = '';
            SET v_plan_id_resolved = NULL;
            
            SET v_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.code'));
            SET v_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.name'));
            SET v_credits = JSON_EXTRACT(@current_record, '$.credits');
            SET v_plan_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.plan_code'));
            SET v_type = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.type'));
            SET v_semester = JSON_EXTRACT(@current_record, '$.semester');
            SET v_prerequisites = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.prerequisites'));
            SET v_description = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.description'));
            SET v_hours_per_week = JSON_EXTRACT(@current_record, '$.hours_per_week');
            -- SET v_is_active = COALESCE(JSON_EXTRACT(@current_record, '$.is_active'), TRUE); -- Old line
            -- SET v_is_active = IF(JSON_EXTRACT(@current_record, '$.is_active') IS NULL, TRUE, JSON_EXTRACT(@current_record, '$.is_active') = JSON_TRUE()); -- Previous correction
            SET v_is_active = IF(JSON_EXTRACT(@current_record, '$.is_active') IS NULL, TRUE, JSON_EXTRACT(@current_record, '$.is_active') = CAST('true' AS JSON));

            -- ===== VALIDACIONES =====
            IF v_code IS NULL OR v_code = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'code', 'REQUIRED', 'El c??digo es requerido', @current_record);
            END IF;
            IF v_name IS NULL OR v_name = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'name', 'REQUIRED', 'El nombre es requerido', @current_record);
            END IF;
            IF v_type IS NULL OR v_type = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'type', 'REQUIRED', 'El tipo es requerido', @current_record);
            END IF;
            IF v_code IS NOT NULL AND (LENGTH(v_code) > 20 OR LENGTH(v_code) < 2) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'code', 'FORMAT', 'El c??digo debe tener entre 2 y 20 caracteres', @current_record);
            END IF;
            IF v_name IS NOT NULL AND LENGTH(v_name) > 255 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'name', 'FORMAT', 'El nombre no puede exceder 255 caracteres', @current_record);
            END IF;
            IF v_type IS NOT NULL AND v_type NOT IN ('subject', 'plan', 'module') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'type', 'ENUM', 'El tipo debe ser: subject, plan o module', @current_record);
            END IF;
            IF v_credits IS NOT NULL AND (v_credits < 0 OR v_credits > 20) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'credits', 'RANGE', 'Los cr??ditos deben estar entre 0 y 20', @current_record);
            END IF;
            IF v_semester IS NOT NULL AND (v_semester < 1 OR v_semester > 10) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'semester', 'RANGE', 'El semestre debe estar entre 1 y 10', @current_record);
            END IF;
            IF v_hours_per_week IS NOT NULL AND (v_hours_per_week < 0 OR v_hours_per_week > 50) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'hours_per_week', 'RANGE', 'Las horas por semana deben estar entre 0 y 50', @current_record);
            END IF;
            IF v_plan_code IS NOT NULL AND v_plan_code != '' THEN
                SELECT id INTO v_plan_id_resolved FROM academic_structures WHERE code = v_plan_code AND type = 'plan' AND deleted_at IS NULL LIMIT 1;
                IF v_plan_id_resolved IS NULL THEN
                    SET v_validation_passed = FALSE;
                    INSERT INTO temp_validation_errors VALUES (v_row_index, 'plan_code', 'FOREIGN_KEY', CONCAT('Plan con c??digo "', v_plan_code, '" no encontrado'), @current_record);
                END IF;
            END IF;
            
            SELECT id INTO v_existing_id FROM academic_structures WHERE code = v_code AND deleted_at IS NULL LIMIT 1;
            
            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'code', 'DUPLICATE', CONCAT('El c??digo "', v_code, '" ya existe (modo INSERT_ONLY)'), @current_record);
            END IF;
            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (v_row_index, 'code', 'NOT_FOUND', CONCAT('El c??digo "', v_code, '" no existe para actualizar (modo UPDATE_ONLY)'), @current_record);
            END IF;
            
            IF v_validation_passed THEN
                IF v_existing_id IS NULL THEN
                    INSERT INTO academic_structures (code, name, credits, plan_id, type, semester, prerequisites, description, hours_per_week, is_active) 
                    VALUES (v_code, v_name, v_credits, v_plan_id_resolved, v_type, v_semester, v_prerequisites, v_description, v_hours_per_week, v_is_active);
                    SET v_insert_count = v_insert_count + 1;
                    SET v_success_count = v_success_count + 1;
                ELSE
                    UPDATE academic_structures SET
                        name = v_name, credits = v_credits, plan_id = v_plan_id_resolved, type = v_type, semester = v_semester,
                        prerequisites = v_prerequisites, description = v_description, hours_per_week = v_hours_per_week, is_active = v_is_active,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = v_existing_id;
                    SET v_update_count = v_update_count + 1;
                    SET v_success_count = v_success_count + 1;
                END IF;
            ELSE
                SET v_error_count = v_error_count + 1;
            END IF;
            
            SET v_row_index = v_row_index + 1;
        END WHILE;
        
        IF v_error_count > 0 THEN
            SET @errors_json = '';
            SELECT JSON_ARRAYAGG(JSON_OBJECT('row', row_index, 'field', field_name, 'type', error_type, 'message', error_message, 'data', record_data)) 
            INTO @errors_json
            FROM temp_validation_errors;
            
            SET p_result_json = JSON_OBJECT(
                'success', FALSE, 'message', 'Procesamiento completado con errores de validaci??n.',
                'statistics', JSON_OBJECT('total_rows', v_row_index, 'success_count', v_success_count, 'error_count', v_error_count, 'insert_count', v_insert_count, 'update_count', v_update_count, 'skip_count', v_skip_count),
                'errors', @errors_json
            );
            ROLLBACK; -- Rollback por errores de validaci??n
        ELSE
            COMMIT; -- Todo exitoso, confirmar transacci??n
            SET p_result_json = JSON_OBJECT(
                'success', TRUE, 'message', 'Todos los registros procesados exitosamente.',
                'statistics', JSON_OBJECT('total_rows', v_row_index, 'success_count', v_success_count, 'error_count', v_error_count, 'insert_count', v_insert_count, 'update_count', v_update_count, 'skip_count', v_skip_count)
            );
        END IF;
    END; -- Fin del procesamiento principal
    
    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_LoadCourseReportsData` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LoadCourseReportsData`(

    IN p_json_data LONGTEXT,

    IN p_user_id INT,

    IN p_update_mode VARCHAR(20),

    OUT p_result_json LONGTEXT

)
proc_main: BEGIN

    DECLARE v_done INT DEFAULT FALSE;

    DECLARE v_error_count INT DEFAULT 0;

    DECLARE v_success_count INT DEFAULT 0;

    DECLARE v_update_count INT DEFAULT 0;

    DECLARE v_insert_count INT DEFAULT 0;

    DECLARE v_skip_count INT DEFAULT 0;

    DECLARE v_row_index INT DEFAULT 0;

    DECLARE v_academic_structure_id INT;

    DECLARE v_student_count INT;

    DECLARE v_term VARCHAR(20);

    DECLARE v_year YEAR;

    DECLARE v_section VARCHAR(10);

    DECLARE v_modality VARCHAR(20);

    DECLARE v_enrolled_count INT;

    DECLARE v_passed_count INT;

    DECLARE v_failed_count INT;

    DECLARE v_withdrawn_count INT;

    DECLARE v_weekly_hours DECIMAL(4,2);

    DECLARE v_total_hours DECIMAL(6,2);

    DECLARE v_is_validated BOOLEAN;

    DECLARE v_notes TEXT;

    DECLARE v_existing_id INT DEFAULT NULL;

    DECLARE v_academic_structure_exists BOOLEAN DEFAULT FALSE;

    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION

    BEGIN

        ROLLBACK;

        GET DIAGNOSTICS CONDITION 1

            @sqlstate = RETURNED_SQLSTATE, 

            @errno = MYSQL_ERRNO, 

            @text = MESSAGE_TEXT;

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', 'Error SQL durante el procesamiento',

            'error_code', @errno,

            'error_message', @text,

            'processed_rows', v_row_index

        );

    END;

    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

    CREATE TEMPORARY TABLE temp_validation_errors (

        row_index INT,

        field_name VARCHAR(50),

        error_type VARCHAR(50),

        error_message TEXT,

        record_data JSON

    );

    START TRANSACTION;

    IF p_update_mode IS NULL OR p_update_mode = '' THEN

        SET p_update_mode = 'UPSERT';

    END IF;

    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', 'JSON de entrada inv├ílido o vac├¡o'

        );

        ROLLBACK;

        LEAVE proc_main;

    END IF;

    IF p_update_mode NOT IN ('INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT') THEN

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', 'Modo de actualizaci├│n inv├ílido. Debe ser: INSERT_ONLY, UPDATE_ONLY o UPSERT'

        );

        ROLLBACK;

        LEAVE proc_main;

    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', CONCAT('Usuario con ID ', p_user_id, ' no encontrado')

        );

        ROLLBACK;

        LEAVE proc_main;

    END IF;

    BEGIN

        SET @array_length = JSON_LENGTH(p_json_data);

        WHILE v_row_index < @array_length DO

            SET @current_record = JSON_EXTRACT(p_json_data, CONCAT('$[', v_row_index, ']'));

            SET v_validation_passed = TRUE;

            SET v_academic_structure_exists = FALSE;            -- Extraer campos del JSON (con manejo correcto de NULL)

            SET v_academic_structure_id = JSON_EXTRACT(@current_record, '$.academic_structure_id');

            SET v_student_count = COALESCE(JSON_EXTRACT(@current_record, '$.student_count'), 0);

            SET v_term = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.term'));

            SET v_year = JSON_EXTRACT(@current_record, '$.year');

            SET v_section = IF(JSON_EXTRACT(@current_record, '$.section') IS NULL, NULL, JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.section')));

            SET v_modality = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.modality')), 'presencial');

            SET v_enrolled_count = CASE 

                WHEN JSON_EXTRACT(@current_record, '$.enrolled_count') = CAST('null' AS JSON) THEN NULL 

                ELSE JSON_EXTRACT(@current_record, '$.enrolled_count') 

            END;

            SET v_passed_count = CASE 

                WHEN JSON_EXTRACT(@current_record, '$.passed_count') = CAST('null' AS JSON) THEN NULL 

                ELSE JSON_EXTRACT(@current_record, '$.passed_count') 

            END;

            SET v_failed_count = CASE 

                WHEN JSON_EXTRACT(@current_record, '$.failed_count') = CAST('null' AS JSON) THEN NULL 

                ELSE JSON_EXTRACT(@current_record, '$.failed_count') 

            END;

            SET v_withdrawn_count = CASE 

                WHEN JSON_EXTRACT(@current_record, '$.withdrawn_count') = CAST('null' AS JSON) THEN NULL 

                ELSE JSON_EXTRACT(@current_record, '$.withdrawn_count') 

            END;

            SET v_weekly_hours = CASE 

                WHEN JSON_EXTRACT(@current_record, '$.weekly_hours') = CAST('null' AS JSON) THEN NULL 

                ELSE JSON_EXTRACT(@current_record, '$.weekly_hours') 

            END;

            SET v_total_hours = CASE 

                WHEN JSON_EXTRACT(@current_record, '$.total_hours') = CAST('null' AS JSON) THEN NULL 

                ELSE JSON_EXTRACT(@current_record, '$.total_hours') 

            END;

            SET v_is_validated = COALESCE(JSON_EXTRACT(@current_record, '$.is_validated'), FALSE);

            SET v_notes = IF(JSON_EXTRACT(@current_record, '$.notes') IS NULL, NULL, JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.notes')));

            IF v_academic_structure_id IS NULL THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'academic_structure_id', 'REQUIRED', 'El ID de estructura acad├®mica es requerido', @current_record

                );

            END IF;

            IF v_term IS NULL OR v_term = '' THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'term', 'REQUIRED', 'El per├¡odo/semestre es requerido', @current_record

                );

            END IF;

            IF v_year IS NULL THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'year', 'REQUIRED', 'El a├▒o acad├®mico es requerido', @current_record

                );

            END IF;

            IF v_academic_structure_id IS NOT NULL THEN

                SELECT COUNT(*) > 0 INTO v_academic_structure_exists

                FROM academic_structures 

                WHERE id = v_academic_structure_id AND deleted_at IS NULL;

                IF NOT v_academic_structure_exists THEN

                    SET v_validation_passed = FALSE;

                    INSERT INTO temp_validation_errors VALUES (

                        v_row_index, 'academic_structure_id', 'FOREIGN_KEY', 

                        CONCAT('Estructura acad├®mica con ID ', v_academic_structure_id, ' no encontrada'), @current_record

                    );

                END IF;

            END IF;

            IF v_term IS NOT NULL AND v_term NOT IN ('1', '2', 'anual', 'intensivo') THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'term', 'ENUM', 'El per├¡odo debe ser: 1, 2, anual o intensivo', @current_record

                );

            END IF;

            IF v_modality IS NOT NULL AND v_modality NOT IN ('presencial', 'online', 'mixta') THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'modality', 'ENUM', 'La modalidad debe ser: presencial, online o mixta', @current_record

                );

            END IF;

            IF v_student_count IS NOT NULL AND v_student_count < 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'student_count', 'RANGE', 'La cantidad de estudiantes debe ser mayor o igual a 0', @current_record

                );

            END IF;

            IF v_year IS NOT NULL AND (v_year < 2020 OR v_year > 2050) THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'year', 'RANGE', 'El a├▒o debe estar entre 2020 y 2050', @current_record

                );

            END IF;

            IF v_enrolled_count IS NOT NULL AND v_enrolled_count < 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'enrolled_count', 'RANGE', 'Los estudiantes matriculados deben ser mayor o igual a 0', @current_record

                );

            END IF;

            IF v_passed_count IS NOT NULL AND v_passed_count < 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'passed_count', 'RANGE', 'Los estudiantes aprobados deben ser mayor o igual a 0', @current_record

                );

            END IF;

            IF v_failed_count IS NOT NULL AND v_failed_count < 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'failed_count', 'RANGE', 'Los estudiantes reprobados deben ser mayor o igual a 0', @current_record

                );

            END IF;

            IF v_withdrawn_count IS NOT NULL AND v_withdrawn_count < 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'withdrawn_count', 'RANGE', 'Los estudiantes retirados deben ser mayor o igual a 0', @current_record

                );

            END IF;

            IF v_weekly_hours IS NOT NULL AND v_weekly_hours <= 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'weekly_hours', 'RANGE', 'Las horas semanales deben ser mayor a 0', @current_record

                );

            END IF;

            IF v_total_hours IS NOT NULL AND v_total_hours <= 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'total_hours', 'RANGE', 'Las horas totales deben ser mayor a 0', @current_record

                );

            END IF;

            IF v_section IS NOT NULL AND LENGTH(v_section) > 10 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'section', 'FORMAT', 'La secci├│n no puede exceder 10 caracteres', @current_record

                );

            END IF;

            IF v_enrolled_count IS NOT NULL AND 

               (v_passed_count IS NOT NULL OR v_failed_count IS NOT NULL OR v_withdrawn_count IS NOT NULL) THEN

                SET @total_accounted = COALESCE(v_passed_count, 0) + COALESCE(v_failed_count, 0) + COALESCE(v_withdrawn_count, 0);

                IF @total_accounted > v_enrolled_count THEN

                    SET v_validation_passed = FALSE;

                    INSERT INTO temp_validation_errors VALUES (

                        v_row_index, 'enrolled_count', 'LOGIC', 

                        CONCAT('El total de estudiantes contabilizados (', @total_accounted, ') excede los matriculados (', v_enrolled_count, ')'), @current_record

                    );

                END IF;

            END IF;

            SELECT id INTO v_existing_id

            FROM course_reports_data 

            WHERE academic_structure_id = v_academic_structure_id 

              AND year = v_year 

              AND term = v_term 

              AND (

                  (section IS NULL AND v_section IS NULL) OR 

                  (section = v_section)

              )

              AND deleted_at IS NULL

            LIMIT 1;

            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'duplicate', 'DUPLICATE', 

                    CONCAT('Ya existe un reporte para la estructura ', v_academic_structure_id, ', a├▒o ', v_year, ', per├¡odo ', v_term, ', secci├│n ', COALESCE(v_section, 'NULL'), ' (modo INSERT_ONLY)'), @current_record

                );

            END IF;

            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'not_found', 'NOT_FOUND', 

                    CONCAT('No existe un reporte para actualizar con estructura ', v_academic_structure_id, ', a├▒o ', v_year, ', per├¡odo ', v_term, ', secci├│n ', COALESCE(v_section, 'NULL'), ' (modo UPDATE_ONLY)'), @current_record

                );

            END IF;

            IF v_validation_passed THEN

                IF v_section = '' THEN SET v_section = NULL; END IF;

                IF v_notes = '' THEN SET v_notes = NULL; END IF;

                IF v_existing_id IS NULL THEN

                    INSERT INTO course_reports_data (

                        academic_structure_id, student_count, term, year, section, modality,

                        enrolled_count, passed_count, failed_count, withdrawn_count,

                        weekly_hours, total_hours, is_validated, notes

                    ) VALUES (

                        v_academic_structure_id, v_student_count, v_term, v_year, v_section, v_modality,

                        v_enrolled_count, v_passed_count, v_failed_count, v_withdrawn_count,

                        v_weekly_hours, v_total_hours, v_is_validated, v_notes

                    );

                    SET v_insert_count = v_insert_count + 1;

                    SET v_success_count = v_success_count + 1;

                ELSE

                    UPDATE course_reports_data SET

                        student_count = v_student_count,

                        modality = v_modality,

                        enrolled_count = v_enrolled_count,

                        passed_count = v_passed_count,

                        failed_count = v_failed_count,

                        withdrawn_count = v_withdrawn_count,

                        weekly_hours = v_weekly_hours,

                        total_hours = v_total_hours,

                        is_validated = v_is_validated,

                        notes = v_notes,

                        updated_at = CURRENT_TIMESTAMP

                    WHERE id = v_existing_id;

                    SET v_update_count = v_update_count + 1;

                    SET v_success_count = v_success_count + 1;

                END IF;

            ELSE

                SET v_error_count = v_error_count + 1;

            END IF;

            SET v_row_index = v_row_index + 1;

        END WHILE;

        IF v_error_count > 0 THEN

            SET @errors_json = '';

            SELECT JSON_ARRAYAGG(

                JSON_OBJECT(

                    'row', row_index,

                    'field', field_name,

                    'type', error_type,

                    'message', error_message,

                    'data', record_data

                )

            ) INTO @errors_json

            FROM temp_validation_errors;

            SET p_result_json = JSON_OBJECT(

                'success', FALSE,

                'message', 'Procesamiento completado con errores',

                'statistics', JSON_OBJECT(

                    'total_rows', v_row_index,

                    'success_count', v_success_count,

                    'error_count', v_error_count,

                    'insert_count', v_insert_count,

                    'update_count', v_update_count,

                    'skip_count', v_skip_count

                ),

                'errors', @errors_json

            );

        ELSE

            COMMIT;

            SET p_result_json = JSON_OBJECT(

                'success', TRUE,

                'message', 'Todos los registros procesados exitosamente',

                'statistics', JSON_OBJECT(

                    'total_rows', v_row_index,

                    'success_count', v_success_count,

                    'error_count', v_error_count,

                    'insert_count', v_insert_count,

                    'update_count', v_update_count,

                    'skip_count', v_skip_count

                )

            );

        END IF;

    END; -- Fin del procesamiento principal

    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

END; ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_LoadPaymentCodes` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LoadPaymentCodes`(
    IN p_json_data LONGTEXT,
    IN p_user_id INT,
    IN p_update_mode VARCHAR(20),
    OUT p_result_json LONGTEXT
)
proc_main: BEGIN
    -- Variables de control
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_success_count INT DEFAULT 0;
    DECLARE v_update_count INT DEFAULT 0;
    DECLARE v_insert_count INT DEFAULT 0;
    DECLARE v_skip_count INT DEFAULT 0;
      -- Variables para procesamiento de cada registro
    DECLARE v_row_index INT DEFAULT 0;
    DECLARE v_code_name VARCHAR(20);
    DECLARE v_description VARCHAR(255);
    DECLARE v_factor DECIMAL(8,4);
    DECLARE v_base_amount DECIMAL(10,2);
    DECLARE v_category VARCHAR(20);
    DECLARE v_type VARCHAR(20);
    DECLARE v_is_active BOOLEAN;
    DECLARE v_requires_hours BOOLEAN;
    DECLARE v_is_taxable BOOLEAN;
    DECLARE v_valid_from VARCHAR(10);  -- Cambiar a VARCHAR para manejar conversi??n
    DECLARE v_valid_until VARCHAR(10); -- Cambiar a VARCHAR para manejar conversi??n
      -- Variables de validaci??n
    DECLARE v_existing_id INT DEFAULT NULL;
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;
    DECLARE v_date_from DATE DEFAULT NULL;  -- Variables auxiliares para fechas
    DECLARE v_date_until DATE DEFAULT NULL;
      -- Variables para manejo de errores
    DECLARE v_errno INT DEFAULT 0;
    DECLARE v_sqlstate VARCHAR(5) DEFAULT '';
    DECLARE v_message TEXT DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_sqlstate = RETURNED_SQLSTATE, 
            v_errno = MYSQL_ERRNO, 
            v_message = MESSAGE_TEXT;
        
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Error SQL durante el procesamiento',
            'error_code', v_errno,
            'error_message', v_message,
            'error_sqlstate', v_sqlstate,
            'processed_rows', v_row_index
        );
    END;
    
    -- Tabla temporal para almacenar errores de validaci??n
    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;
    CREATE TEMPORARY TABLE temp_validation_errors (
        row_index INT,
        field_name VARCHAR(50),
        error_type VARCHAR(50),
        error_message TEXT,
        record_data JSON
    );
    
    -- Iniciar transacci??n
    START TRANSACTION;
    
    -- Establecer valor default para p_update_mode si es NULL
    IF p_update_mode IS NULL OR p_update_mode = '' THEN
        SET p_update_mode = 'UPSERT';
    END IF;
    
    -- Validar que el JSON de entrada es v??lido
    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'JSON de entrada inv??lido o vac??o'
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Validar par??metro de modo de actualizaci??n
    IF p_update_mode NOT IN ('INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT') THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Modo de actualizaci??n inv??lido. Debe ser: INSERT_ONLY, UPDATE_ONLY o UPSERT'
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('Usuario con ID ', p_user_id, ' no encontrado')
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Procesamiento principal
    BEGIN
        -- Obtener el n??mero de elementos en el array JSON
        SET @array_length = JSON_LENGTH(p_json_data);
        
        -- Procesar cada elemento del array JSON
        WHILE v_row_index < @array_length DO
            -- Obtener el registro actual
            SET @current_record = JSON_EXTRACT(p_json_data, CONCAT('$[', v_row_index, ']'));
            
            -- Reiniciar variables de validaci??n
            SET v_validation_passed = TRUE;
            
            -- Extraer campos del JSON
            SET v_code_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.code_name'));
            SET v_description = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.description'));
            SET v_factor = JSON_EXTRACT(@current_record, '$.factor');
            SET v_base_amount = JSON_EXTRACT(@current_record, '$.base_amount');
            SET v_category = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.category'));            SET v_type = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.type'));
            
            -- Manejar booleanos con m??s cuidado
            SET v_is_active = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.is_active') = 'true' THEN TRUE
                WHEN JSON_EXTRACT(@current_record, '$.is_active') = TRUE THEN TRUE
                WHEN JSON_EXTRACT(@current_record, '$.is_active') = 1 THEN TRUE
                ELSE FALSE
            END;
            
            SET v_requires_hours = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.requires_hours') = 'true' THEN TRUE
                WHEN JSON_EXTRACT(@current_record, '$.requires_hours') = TRUE THEN TRUE
                WHEN JSON_EXTRACT(@current_record, '$.requires_hours') = 1 THEN TRUE
                ELSE FALSE
            END;
            
            SET v_is_taxable = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.is_taxable') = 'true' THEN TRUE
                WHEN JSON_EXTRACT(@current_record, '$.is_taxable') = TRUE THEN TRUE
                WHEN JSON_EXTRACT(@current_record, '$.is_taxable') = 1 THEN TRUE
                ELSE FALSE
            END;
            
            SET v_valid_from = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.valid_from'));
            SET v_valid_until = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.valid_until'));
            
            -- ===== VALIDACIONES =====
            
            -- 1. Validar campos requeridos
            IF v_code_name IS NULL OR v_code_name = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'REQUIRED', 'El c??digo de pago es requerido', @current_record
                );
            END IF;
            
            IF v_description IS NULL OR v_description = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'description', 'REQUIRED', 'La descripci??n es requerida', @current_record
                );
            END IF;
            
            IF v_factor IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'factor', 'REQUIRED', 'El factor es requerido', @current_record
                );
            END IF;
            
            IF v_category IS NULL OR v_category = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'category', 'REQUIRED', 'La categor??a es requerida', @current_record
                );
            END IF;
            
            IF v_type IS NULL OR v_type = '' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'type', 'REQUIRED', 'El tipo es requerido', @current_record
                );
            END IF;
            
            -- 2. Validar formato y longitud de campos
            IF v_code_name IS NOT NULL AND (LENGTH(v_code_name) > 20 OR LENGTH(v_code_name) < 2) THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'FORMAT', 'El c??digo debe tener entre 2 y 20 caracteres', @current_record
                );
            END IF;
            
            IF v_description IS NOT NULL AND LENGTH(v_description) > 255 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'description', 'FORMAT', 'La descripci??n no puede exceder 255 caracteres', @current_record
                );
            END IF;
            
            -- 3. Validar valores num??ricos
            IF v_factor IS NOT NULL AND v_factor <= 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'factor', 'RANGE', 'El factor debe ser mayor a 0', @current_record
                );
            END IF;
            
            IF v_base_amount IS NOT NULL AND v_base_amount < 0 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'base_amount', 'RANGE', 'El monto base debe ser mayor o igual a 0', @current_record
                );
            END IF;
            
            -- 4. Validar enums
            IF v_category IS NOT NULL AND v_category NOT IN ('docente', 'administrativo', 'otro') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'category', 'ENUM', 'La categor??a debe ser: docente, administrativo o otro', @current_record
                );
            END IF;
            
            IF v_type IS NOT NULL AND v_type NOT IN ('categoria', 'contrato', 'bono', 'descuento', 'hora') THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'type', 'ENUM', 'El tipo debe ser: categoria, contrato, bono, descuento o hora', @current_record
                );
            END IF;
            
            -- 5. Validar fechas
            IF v_valid_from IS NOT NULL AND v_valid_from != '' AND NOT v_valid_from REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'valid_from', 'FORMAT', 'La fecha desde debe tener formato YYYY-MM-DD', @current_record
                );
            END IF;
            
            IF v_valid_until IS NOT NULL AND v_valid_until != '' AND NOT v_valid_until REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'valid_until', 'FORMAT', 'La fecha hasta debe tener formato YYYY-MM-DD', @current_record
                );
            END IF;
            
            -- 6. Validar coherencia de fechas
            IF v_valid_from IS NOT NULL AND v_valid_from != '' AND 
               v_valid_until IS NOT NULL AND v_valid_until != '' AND 
               v_valid_until < v_valid_from THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'valid_until', 'LOGIC', 'La fecha hasta debe ser mayor o igual a la fecha desde', @current_record
                );
            END IF;
            
            -- 7. Validar duplicados seg??n el modo de operaci??n
            SELECT id INTO v_existing_id
            FROM payment_codes 
            WHERE code_name = v_code_name AND deleted_at IS NULL
            LIMIT 1;
            
            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'DUPLICATE', 
                    CONCAT('El c??digo "', v_code_name, '" ya existe (modo INSERT_ONLY)'), @current_record
                );
            END IF;
            
            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'code_name', 'NOT_FOUND', 
                    CONCAT('El c??digo "', v_code_name, '" no existe para actualizar (modo UPDATE_ONLY)'), @current_record
                );
            END IF;
            
            -- 8. Validaciones de negocio espec??ficas
            -- Los c??digos que requieren horas deben ser de tipo 'hora'
            IF v_requires_hours = TRUE AND v_type != 'hora' THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'requires_hours', 'LOGIC', 
                    'Solo los c??digos de tipo "hora" pueden requerir horas', @current_record
                );
            END IF;
            
            -- Los descuentos deber??an tener factor menor a 1
            IF v_type = 'descuento' AND v_factor >= 1 THEN
                SET v_validation_passed = FALSE;
                INSERT INTO temp_validation_errors VALUES (
                    v_row_index, 'factor', 'LOGIC', 
                    'Los descuentos deber??an tener factor menor a 1', @current_record
                );
            END IF;
              -- ===== PROCESAMIENTO =====
              IF v_validation_passed THEN
                -- Convertir fechas vac??as o NULL a NULL, sino convertir a DATE
                IF v_valid_from IS NULL OR v_valid_from = '' THEN 
                    SET v_date_from = NULL; 
                ELSE
                    SET v_date_from = STR_TO_DATE(v_valid_from, '%Y-%m-%d');
                END IF;
                
                IF v_valid_until IS NULL OR v_valid_until = '' THEN 
                    SET v_date_until = NULL; 
                ELSE
                    SET v_date_until = STR_TO_DATE(v_valid_until, '%Y-%m-%d');
                END IF;
                
                -- Determinar operaci??n: INSERT o UPDATE
                IF v_existing_id IS NULL THEN
                    -- INSERT
                    INSERT INTO payment_codes (
                        code_name, description, factor, base_amount,
                        category, type, is_active, requires_hours, is_taxable,
                        valid_from, valid_until                    ) VALUES (
                        v_code_name, v_description, v_factor, v_base_amount,
                        v_category, v_type, v_is_active, v_requires_hours, v_is_taxable,
                        v_date_from, v_date_until
                    );
                    
                    SET v_insert_count = v_insert_count + 1;
                    SET v_success_count = v_success_count + 1;
                ELSE
                    -- UPDATE
                    UPDATE payment_codes SET
                        description = v_description,
                        factor = v_factor,
                        base_amount = v_base_amount,
                        category = v_category,
                        type = v_type,                        is_active = v_is_active,
                        requires_hours = v_requires_hours,
                        is_taxable = v_is_taxable,
                        valid_from = v_date_from,
                        valid_until = v_date_until,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = v_existing_id;
                    
                    SET v_update_count = v_update_count + 1;
                    SET v_success_count = v_success_count + 1;
                END IF;
            ELSE
                SET v_error_count = v_error_count + 1;
            END IF;
            
            SET v_row_index = v_row_index + 1;
        END WHILE;
        
        -- Preparar resultado
        IF v_error_count > 0 THEN
            -- Si hay errores, construir JSON con detalles de errores
            SET @errors_json = '';
            
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'row', row_index,
                    'field', field_name,
                    'type', error_type,
                    'message', error_message,
                    'data', record_data
                )
            ) INTO @errors_json
            FROM temp_validation_errors;
            
            SET p_result_json = JSON_OBJECT(
                'success', FALSE,
                'message', 'Procesamiento completado con errores',
                'statistics', JSON_OBJECT(
                    'total_rows', v_row_index,
                    'success_count', v_success_count,
                    'error_count', v_error_count,
                    'insert_count', v_insert_count,
                    'update_count', v_update_count,
                    'skip_count', v_skip_count
                ),
                'errors', @errors_json
            );
            
            -- En caso de errores, rollback opcional (configurable)
            -- ROLLBACK;
        ELSE
            -- Todo exitoso, confirmar transacci??n
            COMMIT;
            
            SET p_result_json = JSON_OBJECT(
                'success', TRUE,
                'message', 'Todos los registros procesados exitosamente',
                'statistics', JSON_OBJECT(
                    'total_rows', v_row_index,
                    'success_count', v_success_count,
                    'error_count', v_error_count,
                    'insert_count', v_insert_count,
                    'update_count', v_update_count,
                    'skip_count', v_skip_count
                )
            );
        END IF;
        
    END; -- Fin del procesamiento principal
    
    -- Limpiar tabla temporal
    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_LoadPaymentCodes_Debug` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LoadPaymentCodes_Debug`(
    IN p_json_data LONGTEXT,
    IN p_user_id INT,
    IN p_update_mode VARCHAR(20),
    OUT p_result_json LONGTEXT
)
proc_main: BEGIN
    -- Variables de control
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_success_count INT DEFAULT 0;
    DECLARE v_row_index INT DEFAULT 0;
    
    -- Variables para procesamiento de cada registro
    DECLARE v_code_name VARCHAR(20);
    DECLARE v_description VARCHAR(255);
    DECLARE v_factor DECIMAL(8,4);
    DECLARE v_base_amount DECIMAL(10,2);
    DECLARE v_category VARCHAR(20);
    DECLARE v_type VARCHAR(20);
    DECLARE v_is_active BOOLEAN;
    DECLARE v_requires_hours BOOLEAN;
    DECLARE v_is_taxable BOOLEAN;    DECLARE v_valid_from VARCHAR(10);  -- Cambiar a VARCHAR para manejar conversi??n
    DECLARE v_valid_until VARCHAR(10); -- Cambiar a VARCHAR para manejar conversi??n
    
    -- Variables de validaci??n
    DECLARE v_existing_id INT DEFAULT NULL;
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;
    DECLARE v_debug_info TEXT DEFAULT '';
    
    -- Variables para manejo de errores
    DECLARE v_errno INT DEFAULT 0;
    DECLARE v_sqlstate VARCHAR(5) DEFAULT '';
    DECLARE v_message TEXT DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_sqlstate = RETURNED_SQLSTATE, 
            v_errno = MYSQL_ERRNO, 
            v_message = MESSAGE_TEXT;
        
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Error SQL durante el procesamiento',
            'error_code', v_errno,
            'error_message', v_message,
            'error_sqlstate', v_sqlstate,
            'processed_rows', v_row_index,
            'debug_info', v_debug_info
        );
    END;
    
    -- Iniciar transacci??n
    START TRANSACTION;
    
    SET v_debug_info = 'Iniciando validaciones preliminares';
    
    -- Establecer valor default para p_update_mode si es NULL
    IF p_update_mode IS NULL OR p_update_mode = '' THEN
        SET p_update_mode = 'UPSERT';
    END IF;
    
    SET v_debug_info = CONCAT(v_debug_info, ' | Modo: ', p_update_mode);
    
    -- Validar que el JSON de entrada es v??lido
    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'JSON de entrada inv??lido o vac??o',
            'debug_info', CONCAT(v_debug_info, ' | JSON inv??lido')
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    SET v_debug_info = CONCAT(v_debug_info, ' | JSON v??lido');
    
    -- Validar par??metro de modo de actualizaci??n
    IF p_update_mode NOT IN ('INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT') THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Modo de actualizaci??n inv??lido. Debe ser: INSERT_ONLY, UPDATE_ONLY o UPSERT',
            'debug_info', CONCAT(v_debug_info, ' | Modo inv??lido: ', p_update_mode)
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    SET v_debug_info = CONCAT(v_debug_info, ' | Modo v??lido');
    
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', CONCAT('Usuario con ID ', p_user_id, ' no encontrado'),
            'debug_info', CONCAT(v_debug_info, ' | Usuario no encontrado: ', p_user_id)
        );
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    SET v_debug_info = CONCAT(v_debug_info, ' | Usuario v??lido');
    
    -- Obtener el n??mero de elementos en el array JSON
    SET @array_length = JSON_LENGTH(p_json_data);
    SET v_debug_info = CONCAT(v_debug_info, ' | Array length: ', @array_length);
    
    -- Procesar cada elemento del array JSON
    WHILE v_row_index < @array_length DO
        SET v_validation_passed = TRUE;
        SET v_existing_id = NULL;
        
        -- Obtener el registro actual
        SET @current_record = JSON_EXTRACT(p_json_data, CONCAT('$[', v_row_index, ']'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Procesando fila: ', v_row_index);
          -- Extraer valores del JSON
        SET v_code_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.code_name'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do code_name: ', COALESCE(v_code_name, 'NULL'));
        
        SET v_description = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.description'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do description: ', COALESCE(LEFT(v_description, 20), 'NULL'));
        
        SET v_factor = JSON_EXTRACT(@current_record, '$.factor');
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do factor: ', COALESCE(v_factor, 'NULL'));
        
        SET v_base_amount = JSON_EXTRACT(@current_record, '$.base_amount');
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do base_amount: ', COALESCE(v_base_amount, 'NULL'));
        
        SET v_category = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.category'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do category: ', COALESCE(v_category, 'NULL'));
        
        SET v_type = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.type'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do type: ', COALESCE(v_type, 'NULL'));
        
        -- Manejar booleanos con m??s cuidado
        SET v_is_active = CASE 
            WHEN JSON_EXTRACT(@current_record, '$.is_active') = 'true' THEN TRUE
            WHEN JSON_EXTRACT(@current_record, '$.is_active') = TRUE THEN TRUE
            WHEN JSON_EXTRACT(@current_record, '$.is_active') = 1 THEN TRUE
            ELSE FALSE
        END;
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do is_active: ', v_is_active);
        
        SET v_requires_hours = CASE 
            WHEN JSON_EXTRACT(@current_record, '$.requires_hours') = 'true' THEN TRUE
            WHEN JSON_EXTRACT(@current_record, '$.requires_hours') = TRUE THEN TRUE
            WHEN JSON_EXTRACT(@current_record, '$.requires_hours') = 1 THEN TRUE
            ELSE FALSE
        END;
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do requires_hours: ', v_requires_hours);
        
        SET v_is_taxable = CASE 
            WHEN JSON_EXTRACT(@current_record, '$.is_taxable') = 'true' THEN TRUE
            WHEN JSON_EXTRACT(@current_record, '$.is_taxable') = TRUE THEN TRUE
            WHEN JSON_EXTRACT(@current_record, '$.is_taxable') = 1 THEN TRUE
            ELSE FALSE
        END;
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do is_taxable: ', v_is_taxable);
        
        SET v_valid_from = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.valid_from'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do valid_from: ', COALESCE(v_valid_from, 'NULL'));
        
        SET v_valid_until = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.valid_until'));
        SET v_debug_info = CONCAT(v_debug_info, ' | Extra??do valid_until: ', COALESCE(v_valid_until, 'NULL'));
        
        -- Validaciones b??sicas
        IF v_code_name IS NULL OR v_code_name = '' THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: code_name vac??o');
        END IF;
        
        IF v_description IS NULL OR v_description = '' THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: description vac??a');
        END IF;
        
        IF v_factor IS NULL THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: factor NULL');
        END IF;
        
        IF v_category IS NULL OR v_category = '' THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: category vac??a');
        END IF;
        
        IF v_type IS NULL OR v_type = '' THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: type vac??o');
        END IF;
        
        -- Validar enums
        IF v_category IS NOT NULL AND v_category NOT IN ('docente', 'administrativo', 'otro') THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: category inv??lida: ', v_category);
        END IF;
        
        IF v_type IS NOT NULL AND v_type NOT IN ('categoria', 'contrato', 'bono', 'descuento', 'hora') THEN
            SET v_validation_passed = FALSE;
            SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: type inv??lido: ', v_type);
        END IF;
          -- Verificar si el c??digo existe
        SELECT id INTO v_existing_id FROM payment_codes WHERE code_name = v_code_name AND deleted_at IS NULL LIMIT 1;
        SET v_debug_info = CONCAT(v_debug_info, ' | existing_id: ', COALESCE(v_existing_id, 'NULL'));
          IF v_validation_passed THEN
            SET v_debug_info = CONCAT(v_debug_info, ' | Validaciones pasadas');
              -- Convertir fechas vac??as a NULL con logging detallado
            SET v_debug_info = CONCAT(v_debug_info, ' | Procesando fecha from: ', COALESCE(v_valid_from, 'NULL'));
            IF v_valid_from IS NULL OR v_valid_from = '' THEN 
                SET v_valid_from = NULL; 
                SET v_debug_info = CONCAT(v_debug_info, ' | from convertida a NULL');
            ELSE
                SET v_valid_from = STR_TO_DATE(v_valid_from, '%Y-%m-%d');
                SET v_debug_info = CONCAT(v_debug_info, ' | from convertida a DATE');
            END IF;
            
            SET v_debug_info = CONCAT(v_debug_info, ' | Procesando fecha until: ', COALESCE(v_valid_until, 'NULL'));
            IF v_valid_until IS NULL OR v_valid_until = '' THEN 
                SET v_valid_until = NULL; 
                SET v_debug_info = CONCAT(v_debug_info, ' | until convertida a NULL');
            ELSE
                SET v_valid_until = STR_TO_DATE(v_valid_until, '%Y-%m-%d');
                SET v_debug_info = CONCAT(v_debug_info, ' | until convertida a DATE');
            END IF;
            SET v_debug_info = CONCAT(v_debug_info, ' | Fechas procesadas');
            
            -- Determinar operaci??n: INSERT o UPDATE
            IF v_existing_id IS NULL THEN
                SET v_debug_info = CONCAT(v_debug_info, ' | Preparando INSERT');
                
                -- Validar que los valores no sean NULL cuando no deben serlo
                IF v_code_name IS NULL THEN
                    SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: code_name es NULL antes de INSERT');
                ELSEIF v_description IS NULL THEN
                    SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: description es NULL antes de INSERT');
                ELSEIF v_factor IS NULL THEN
                    SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: factor es NULL antes de INSERT');
                ELSEIF v_category IS NULL THEN
                    SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: category es NULL antes de INSERT');
                ELSEIF v_type IS NULL THEN
                    SET v_debug_info = CONCAT(v_debug_info, ' | ERROR: type es NULL antes de INSERT');
                ELSE
                    SET v_debug_info = CONCAT(v_debug_info, ' | Valores validados para INSERT');
                    
                    -- INSERT
                    INSERT INTO payment_codes (
                        code_name, description, factor, base_amount,
                        category, type, is_active, requires_hours, is_taxable,
                        valid_from, valid_until
                    ) VALUES (
                        v_code_name, v_description, v_factor, v_base_amount,
                        v_category, v_type, v_is_active, v_requires_hours, v_is_taxable,
                        v_valid_from, v_valid_until
                    );
                    
                    SET v_success_count = v_success_count + 1;
                    SET v_debug_info = CONCAT(v_debug_info, ' | INSERT exitoso, new_id: ', LAST_INSERT_ID());
                END IF;
            ELSE
                SET v_debug_info = CONCAT(v_debug_info, ' | Preparando UPDATE para ID: ', v_existing_id);
                -- UPDATE
                UPDATE payment_codes SET
                    description = v_description,
                    factor = v_factor,
                    base_amount = v_base_amount,
                    category = v_category,
                    type = v_type,
                    is_active = v_is_active,
                    requires_hours = v_requires_hours,
                    is_taxable = v_is_taxable,
                    valid_from = v_valid_from,
                    valid_until = v_valid_until,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = v_existing_id;
                
                SET v_success_count = v_success_count + 1;
                SET v_debug_info = CONCAT(v_debug_info, ' | UPDATE exitoso');
            END IF;
        ELSE
            SET v_error_count = v_error_count + 1;
            SET v_debug_info = CONCAT(v_debug_info, ' | Validaciones fallaron');
        END IF;
        
        SET v_row_index = v_row_index + 1;
    END WHILE;
    
    -- Preparar resultado
    IF v_error_count > 0 THEN
        SET p_result_json = JSON_OBJECT(
            'success', FALSE,
            'error', 'Se encontraron errores de validaci??n',
            'error_count', v_error_count,
            'success_count', v_success_count,
            'processed_rows', v_row_index,
            'debug_info', v_debug_info
        );
        ROLLBACK;
    ELSE
        SET p_result_json = JSON_OBJECT(
            'success', TRUE,
            'message', 'C??digos de pago procesados exitosamente',
            'total_processed', v_row_index,
            'total_success', v_success_count,
            'total_errors', v_error_count,
            'debug_info', v_debug_info
        );
        COMMIT;
    END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_LoadTeachers` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_LoadTeachers`(

    IN p_json_data LONGTEXT,

    IN p_user_id INT,

    IN p_update_mode VARCHAR(20),

    OUT p_result_json LONGTEXT

)
proc_main: BEGIN

    DECLARE v_done INT DEFAULT FALSE;

    DECLARE v_error_count INT DEFAULT 0;

    DECLARE v_success_count INT DEFAULT 0;

    DECLARE v_update_count INT DEFAULT 0;

    DECLARE v_insert_count INT DEFAULT 0;

    DECLARE v_skip_count INT DEFAULT 0;

    DECLARE v_row_index INT DEFAULT 0;

    DECLARE v_rut VARCHAR(12);

    DECLARE v_name VARCHAR(255);

    DECLARE v_email VARCHAR(255);

    DECLARE v_phone VARCHAR(20);

    DECLARE v_address TEXT;

    DECLARE v_academic_degree VARCHAR(100);

    DECLARE v_specialization VARCHAR(255);

    DECLARE v_university VARCHAR(255);

    DECLARE v_category_code VARCHAR(20);

    DECLARE v_contract_type_code VARCHAR(20);

    DECLARE v_hire_date DATE;

    DECLARE v_contract_hours INT;

    DECLARE v_salary_base DECIMAL(10,2);

    DECLARE v_is_active BOOLEAN;

    DECLARE v_can_coordinate BOOLEAN;

    DECLARE v_max_hours_per_week INT;

    DECLARE v_existing_id INT DEFAULT NULL;

    DECLARE v_category_id INT DEFAULT NULL;

    DECLARE v_contract_type_id INT DEFAULT NULL;

    DECLARE v_rut_normalized VARCHAR(12);

    DECLARE v_rut_valid BOOLEAN DEFAULT FALSE;

    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION

    BEGIN

        ROLLBACK;

        GET DIAGNOSTICS CONDITION 1

            @sqlstate = RETURNED_SQLSTATE, 

            @errno = MYSQL_ERRNO, 

            @text = MESSAGE_TEXT;

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', 'Error SQL durante el procesamiento',

            'error_code', @errno,

            'error_message', @text,

            'processed_rows', v_row_index

        );

    END;

    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

    CREATE TEMPORARY TABLE temp_validation_errors (

        row_index INT,

        field_name VARCHAR(50),

        error_type VARCHAR(50),

        error_message TEXT,

        record_data JSON

    );

    START TRANSACTION;

    IF p_update_mode IS NULL OR p_update_mode = '' THEN

        SET p_update_mode = 'UPSERT';

    END IF;

    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', 'JSON de entrada inv├ílido o vac├¡o'

        );

        ROLLBACK;

        LEAVE proc_main;

    END IF;

    IF p_update_mode NOT IN ('INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT') THEN

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', 'Modo de actualizaci├│n inv├ílido. Debe ser: INSERT_ONLY, UPDATE_ONLY o UPSERT'

        );

        ROLLBACK;

        LEAVE proc_main;

    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN

        SET p_result_json = JSON_OBJECT(

            'success', FALSE,

            'error', CONCAT('Usuario con ID ', p_user_id, ' no encontrado')

        );

        ROLLBACK;

        LEAVE proc_main;

    END IF;

    BEGIN

        SET @array_length = JSON_LENGTH(p_json_data);

        WHILE v_row_index < @array_length DO

            SET @current_record = JSON_EXTRACT(p_json_data, CONCAT('$[', v_row_index, ']'));

            SET v_validation_passed = TRUE;

            SET v_category_id = NULL;

            SET v_contract_type_id = NULL;

            SET v_rut_valid = FALSE;

            SET v_rut = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.rut'));

            SET v_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.name'));

            SET v_email = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.email'));

            SET v_phone = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.phone'));

            SET v_address = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.address'));

            SET v_academic_degree = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.academic_degree'));

            SET v_specialization = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.specialization'));

            SET v_university = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.university'));

            SET v_category_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.category_code'));

            SET v_contract_type_code = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.contract_type_code'));

            SET v_hire_date = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.hire_date'));

            SET v_contract_hours = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.contract_hours') IS NULL THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.contract_hours') 
            END;

            SET v_salary_base = CASE 
                WHEN JSON_EXTRACT(@current_record, '$.salary_base') IS NULL THEN NULL 
                ELSE JSON_EXTRACT(@current_record, '$.salary_base') 
            END;

            SET v_is_active = IF(
                JSON_EXTRACT(@current_record, '$.is_active') IS NULL, 
                TRUE, 
                JSON_EXTRACT(@current_record, '$.is_active') = CAST('true' AS JSON)
            );

            SET v_can_coordinate = IF(
                JSON_EXTRACT(@current_record, '$.can_coordinate') IS NULL, 
                FALSE, 
                JSON_EXTRACT(@current_record, '$.can_coordinate') = CAST('true' AS JSON)
            );

            SET v_max_hours_per_week = COALESCE(JSON_EXTRACT(@current_record, '$.max_hours_per_week'), 40);

            IF v_rut IS NULL OR v_rut = '' THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'rut', 'REQUIRED', 'El RUT es requerido', @current_record

                );

            END IF;

            IF v_name IS NULL OR v_name = '' THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'name', 'REQUIRED', 'El nombre es requerido', @current_record

                );

            END IF;

            IF v_email IS NULL OR v_email = '' THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'email', 'REQUIRED', 'El email es requerido', @current_record

                );

            END IF;

            IF v_name IS NOT NULL AND LENGTH(v_name) > 255 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'name', 'FORMAT', 'El nombre no puede exceder 255 caracteres', @current_record

                );

            END IF;

            IF v_email IS NOT NULL AND (LENGTH(v_email) > 255 OR v_email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$') THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'email', 'FORMAT', 'El email debe tener formato v├ílido y m├íximo 255 caracteres', @current_record

                );

            END IF;

            IF v_phone IS NOT NULL AND LENGTH(v_phone) > 20 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'phone', 'FORMAT', 'El tel├®fono no puede exceder 20 caracteres', @current_record

                );

            END IF;

            IF v_rut IS NOT NULL AND v_rut != '' THEN

                SET v_rut_normalized = UPPER(REPLACE(REPLACE(v_rut, '.', ''), '-', ''));

                IF v_rut_normalized REGEXP '^[0-9]{7,8}[0-9K]$' THEN

                    SET @rut_numbers = SUBSTRING(v_rut_normalized, 1, LENGTH(v_rut_normalized) - 1);

                    SET @rut_dv = SUBSTRING(v_rut_normalized, LENGTH(v_rut_normalized), 1);

                    SET @suma = 0;

                    SET @multiplicador = 2;

                    SET @i = LENGTH(@rut_numbers);

                    WHILE @i > 0 DO

                        SET @suma = @suma + (SUBSTRING(@rut_numbers, @i, 1) * @multiplicador);

                        SET @multiplicador = @multiplicador + 1;

                        IF @multiplicador > 7 THEN SET @multiplicador = 2; END IF;

                        SET @i = @i - 1;

                    END WHILE;

                    SET @resto = @suma % 11;

                    SET @dv_calculado = CASE 

                        WHEN @resto = 0 THEN '0'

                        WHEN @resto = 1 THEN 'K'

                        ELSE CAST(11 - @resto AS CHAR)

                    END;

                    IF @dv_calculado = @rut_dv THEN

                        SET v_rut_valid = TRUE;

                        SET v_rut = CONCAT(SUBSTRING(v_rut_normalized, 1, LENGTH(v_rut_normalized) - 1), '-', @rut_dv);

                    END IF;

                END IF;

                IF NOT v_rut_valid THEN

                    SET v_validation_passed = FALSE;

                    INSERT INTO temp_validation_errors VALUES (

                        v_row_index, 'rut', 'FORMAT', 'RUT chileno inv├ílido', @current_record

                    );

                END IF;

            END IF;

            IF v_contract_hours IS NOT NULL AND (v_contract_hours < 0 OR v_contract_hours > 44) THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'contract_hours', 'RANGE', 'Las horas contractuales deben estar entre 0 y 44', @current_record

                );

            END IF;

            IF v_salary_base IS NOT NULL AND v_salary_base < 0 THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'salary_base', 'RANGE', 'El salario base debe ser mayor o igual a 0', @current_record

                );

            END IF;

            IF v_max_hours_per_week IS NOT NULL AND (v_max_hours_per_week < 0 OR v_max_hours_per_week > 60) THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'max_hours_per_week', 'RANGE', 'Las horas m├íximas por semana deben estar entre 0 y 60', @current_record

                );

            END IF;

            IF v_category_code IS NOT NULL AND v_category_code != '' THEN

                SELECT id INTO v_category_id

                FROM payment_codes 

                WHERE code_name = v_category_code 

                  AND category = 'docente' 

                  AND is_active = TRUE 

                  AND deleted_at IS NULL

                LIMIT 1;

                IF v_category_id IS NULL THEN

                    SET v_validation_passed = FALSE;

                    INSERT INTO temp_validation_errors VALUES (

                        v_row_index, 'category_code', 'FOREIGN_KEY', 

                        CONCAT('Categor├¡a docente con c├│digo "', v_category_code, '" no encontrada'), @current_record

                    );

                END IF;

            END IF;

            IF v_contract_type_code IS NOT NULL AND v_contract_type_code != '' THEN

                SELECT id INTO v_contract_type_id

                FROM payment_codes 

                WHERE code_name = v_contract_type_code 

                  AND type = 'contrato' 

                  AND is_active = TRUE 

                  AND deleted_at IS NULL

                LIMIT 1;

                IF v_contract_type_id IS NULL THEN

                    SET v_validation_passed = FALSE;

                    INSERT INTO temp_validation_errors VALUES (

                        v_row_index, 'contract_type_code', 'FOREIGN_KEY', 

                        CONCAT('Tipo de contrato con c├│digo "', v_contract_type_code, '" no encontrado'), @current_record

                    );

                END IF;

            END IF;

            SELECT id INTO v_existing_id

            FROM teachers 

            WHERE rut = v_rut AND deleted_at IS NULL

            LIMIT 1;

            IF p_update_mode = 'INSERT_ONLY' AND v_existing_id IS NOT NULL THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'rut', 'DUPLICATE', 

                    CONCAT('El RUT "', v_rut, '" ya existe (modo INSERT_ONLY)'), @current_record

                );

            END IF;

            IF p_update_mode = 'UPDATE_ONLY' AND v_existing_id IS NULL THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'rut', 'NOT_FOUND', 

                    CONCAT('El RUT "', v_rut, '" no existe para actualizar (modo UPDATE_ONLY)'), @current_record

                );

            END IF;

            IF v_email IS NOT NULL AND EXISTS (

                SELECT 1 FROM teachers 

                WHERE email = v_email 

                  AND (v_existing_id IS NULL OR id != v_existing_id)

                  AND deleted_at IS NULL

            ) THEN

                SET v_validation_passed = FALSE;

                INSERT INTO temp_validation_errors VALUES (

                    v_row_index, 'email', 'DUPLICATE', 

                    CONCAT('El email "', v_email, '" ya est├í en uso por otro docente'), @current_record

                );

            END IF;

            IF v_validation_passed THEN

                IF v_existing_id IS NULL THEN

                    INSERT INTO teachers (

                        rut, name, email, phone, address,

                        academic_degree, specialization, university,

                        category_id, contract_type_id, hire_date,

                        contract_hours, salary_base,

                        is_active, can_coordinate, max_hours_per_week

                    ) VALUES (

                        v_rut, v_name, v_email, v_phone, v_address,

                        v_academic_degree, v_specialization, v_university,

                        v_category_id, v_contract_type_id, v_hire_date,

                        v_contract_hours, v_salary_base,

                        v_is_active, v_can_coordinate, v_max_hours_per_week

                    );

                    SET v_insert_count = v_insert_count + 1;

                    SET v_success_count = v_success_count + 1;

                ELSE

                    UPDATE teachers SET

                        name = v_name,

                        email = v_email,

                        phone = v_phone,

                        address = v_address,

                        academic_degree = v_academic_degree,

                        specialization = v_specialization,

                        university = v_university,

                        category_id = v_category_id,

                        contract_type_id = v_contract_type_id,

                        hire_date = v_hire_date,

                        contract_hours = v_contract_hours,

                        salary_base = v_salary_base,

                        is_active = v_is_active,

                        can_coordinate = v_can_coordinate,

                        max_hours_per_week = v_max_hours_per_week,

                        updated_at = CURRENT_TIMESTAMP

                    WHERE id = v_existing_id;

                    SET v_update_count = v_update_count + 1;

                    SET v_success_count = v_success_count + 1;

                END IF;

            ELSE

                SET v_error_count = v_error_count + 1;

            END IF;

            SET v_row_index = v_row_index + 1;

        END WHILE;

        IF v_error_count > 0 THEN

            SET @errors_json = '';

            SELECT JSON_ARRAYAGG(

                JSON_OBJECT(

                    'row', row_index,

                    'field', field_name,

                    'type', error_type,

                    'message', error_message,

                    'data', record_data

                )

            ) INTO @errors_json

            FROM temp_validation_errors;

            SET p_result_json = JSON_OBJECT(

                'success', FALSE,

                'message', 'Procesamiento completado con errores',

                'statistics', JSON_OBJECT(

                    'total_rows', v_row_index,

                    'success_count', v_success_count,

                    'error_count', v_error_count,

                    'insert_count', v_insert_count,

                    'update_count', v_update_count,

                    'skip_count', v_skip_count

                ),

                'errors', @errors_json

            );

        ELSE

            COMMIT;

            SET p_result_json = JSON_OBJECT(

                'success', TRUE,

                'message', 'Todos los registros procesados exitosamente',

                'statistics', JSON_OBJECT(

                    'total_rows', v_row_index,

                    'success_count', v_success_count,

                    'error_count', v_error_count,

                    'insert_count', v_insert_count,

                    'update_count', v_update_count,

                    'skip_count', v_skip_count

                )

            );

        END IF;

    END; -- Fin del procesamiento principal

    DROP TEMPORARY TABLE IF EXISTS temp_validation_errors;

END; ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_LoadTeachers_Debug` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_LoadTeachers_Debug`(
    IN p_json_data LONGTEXT,
    IN p_user_id INT,
    IN p_update_mode VARCHAR(20),
    OUT p_result_json LONGTEXT
)
proc_main: BEGIN
    -- Variables b??sicas
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_success_count INT DEFAULT 0;
    DECLARE v_insert_count INT DEFAULT 0;
    DECLARE v_row_index INT DEFAULT 0;
    
    -- Variables para datos
    DECLARE v_rut VARCHAR(12);
    DECLARE v_name VARCHAR(255);
    DECLARE v_email VARCHAR(255);
    
    -- Validaciones b??sicas
    IF p_json_data IS NULL OR p_json_data = '' OR NOT JSON_VALID(p_json_data) THEN
        SET p_result_json = JSON_OBJECT('success', FALSE, 'error', 'JSON inv??lido');
        LEAVE proc_main;
    END IF;
    
    START TRANSACTION;
    
    -- Obtener primer elemento para testing
    SET @current_record = JSON_EXTRACT(p_json_data, '$[0]');
    SET v_rut = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.rut'));
    SET v_name = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.name'));
    SET v_email = JSON_UNQUOTE(JSON_EXTRACT(@current_record, '$.email'));
    
    -- Validaciones m??nimas
    IF v_rut IS NULL OR v_name IS NULL OR v_email IS NULL THEN
        SET p_result_json = JSON_OBJECT('success', FALSE, 'error', 'Campos requeridos faltantes');
        ROLLBACK;
        LEAVE proc_main;
    END IF;
    
    -- Inserci??n simple
    INSERT INTO teachers (rut, name, email, is_active) 
    VALUES (v_rut, v_name, v_email, TRUE);
    
    COMMIT;
    
    SET p_result_json = JSON_OBJECT(
        'success', TRUE,
        'message', 'Registro insertado exitosamente',
        'statistics', JSON_OBJECT('insert_count', 1)
    );

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_ValidateAndSaveScheduleEvent` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`planificacion_user`@`localhost` PROCEDURE `sp_ValidateAndSaveScheduleEvent`(
    IN p_event_data JSON,
    IN p_user_id INT,
    OUT o_event_id INT,
    OUT o_status_code VARCHAR(50),
    OUT o_error_message TEXT
)
BEGIN
    DECLARE v_academic_structure_id INT;
    DECLARE v_teacher_id INT;
    DECLARE v_area_id INT;
    DECLARE v_start_datetime DATETIME;
    DECLARE v_end_datetime DATETIME;
    DECLARE v_day_of_week VARCHAR(10);
    DECLARE v_classroom VARCHAR(50);
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_academic_structure_exists INT DEFAULT 0;
    DECLARE v_teacher_exists INT DEFAULT 0;
    DECLARE v_validation_passed BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET o_status_code = 'ERROR';
        SET o_error_message = 'Error interno de base de datos';
        SET o_event_id = NULL;
    END;

    START TRANSACTION;

    -- Extraer datos del JSON
    SET v_academic_structure_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.academic_structure_id'));
    SET v_teacher_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.teacher_id'));
    SET v_area_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.area_id'));
    SET v_start_datetime = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.start_datetime')), '%Y-%m-%d %H:%i:%s');
    SET v_end_datetime = STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.end_datetime')), '%Y-%m-%d %H:%i:%s');
    SET v_day_of_week = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.day_of_week'));
    SET v_classroom = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.classroom'));

    -- Inicializar variables de salida
    SET o_event_id = NULL;
    SET o_status_code = 'SUCCESS';
    SET o_error_message = NULL;

    -- 1. VALIDACIONES B??SICAS
    IF v_start_datetime >= v_end_datetime THEN
        SET v_validation_passed = FALSE;
        SET o_status_code = 'VALIDATION_ERROR';
        SET o_error_message = 'La fecha de inicio debe ser anterior a la fecha de fin';
    END IF;

    -- 2. VALIDAR EXISTENCIA DE ESTRUCTURA ACAD??MICA
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_academic_structure_exists
        FROM academic_structures
        WHERE id = v_academic_structure_id AND is_active = TRUE;

        IF v_academic_structure_exists = 0 THEN
            SET v_validation_passed = FALSE;
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'La asignatura especificada no existe o no est?? activa';
        END IF;
    END IF;

    -- 3. VALIDAR EXISTENCIA DE DOCENTE
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_teacher_exists
        FROM teachers
        WHERE id = v_teacher_id AND is_active = TRUE;

        IF v_teacher_exists = 0 THEN
            SET v_validation_passed = FALSE;
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'El docente especificado no existe o no est?? activo';
        END IF;
    END IF;

    -- 4. VALIDACI??N DE SOLAPAMIENTO DE DOCENTE
    IF v_validation_passed THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedule_events
        WHERE teacher_id = v_teacher_id
        AND is_active = TRUE
          AND (
              (v_start_datetime < end_datetime AND v_end_datetime > start_datetime)
          );

        IF v_conflict_count > 0 THEN
            SET v_validation_passed = FALSE;
            SET o_status_code = 'VALIDATION_ERROR';
            SET o_error_message = 'El docente ya tiene un evento programado en el horario especificado';
        END IF;
    END IF;

    -- 5. CREAR EVENTO SI TODAS LAS VALIDACIONES PASARON
    IF v_validation_passed THEN
        INSERT INTO schedule_events (
            academic_structure_id,
            teacher_id,
            area_id,
            start_datetime,
            end_datetime,
            day_of_week,
            classroom,
            status_id,
            is_active,
            conflicts_checked,
            validation_notes,
            created_by_user_id,
            created_at
        ) VALUES (
            v_academic_structure_id,
            v_teacher_id,
            v_area_id,
            v_start_datetime,
            v_end_datetime,
            v_day_of_week,
            v_classroom,
            1,
            TRUE,
            TRUE,
            'Evento creado con validaciones exitosas',
            p_user_id,
            CURRENT_TIMESTAMP
        );

        SET o_event_id = LAST_INSERT_ID();
        SET o_status_code = 'SUCCESS';
        SET o_error_message = 'Evento creado exitosamente';
        COMMIT;
    ELSE
        ROLLBACK;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `v_schedule_events_active`
--

/*!50001 DROP VIEW IF EXISTS `v_schedule_events_active`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_schedule_events_active` AS select `e`.`id` AS `id`,`e`.`title` AS `title`,`e`.`description` AS `description`,`e`.`start_date` AS `start_date`,`e`.`end_date` AS `end_date`,`e`.`teacher` AS `teacher`,`e`.`subject` AS `subject`,`e`.`room` AS `room`,`e`.`students` AS `students`,`e`.`background_color` AS `background_color`,`e`.`bimestre_id` AS `bimestre_id`,`e`.`created_at` AS `created_at`,`e`.`updated_at` AS `updated_at`,`b`.`nombre` AS `bimestre_nombre`,`b`.`anoAcademico` AS `bimestre_ano_academico`,`b`.`fechaInicio` AS `bimestre_fecha_inicio`,`b`.`fechaFin` AS `bimestre_fecha_fin`,timestampdiff(MINUTE,`e`.`start_date`,`e`.`end_date`) AS `duration_minutes`,cast(`e`.`start_date` as date) AS `event_date` from (`schedule_events` `e` left join `bimestres` `b` on((`e`.`bimestre_id` = `b`.`id`))) where (`e`.`active` = true) order by `e`.`start_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-17 17:28:16
