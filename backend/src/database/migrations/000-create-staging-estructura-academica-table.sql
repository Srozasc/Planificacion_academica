-- planificacion_academica.staging_estructura_academica definition

CREATE TABLE `staging_estructura_academica` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrera` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sigla` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asignatura` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditos` int DEFAULT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horas` int DEFAULT NULL,
  `duracion_carrera` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clplestud` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_escuela` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `escuela_programa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_bimestre` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=282 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;