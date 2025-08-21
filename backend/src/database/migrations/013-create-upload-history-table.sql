-- Script de migración: Crear tabla de logs de cargas (Opción 1)
-- Fecha: 2024
-- Descripción: Tabla simple para registrar cargas de archivos desde el servicio

USE planificacion_academica;

-- Crear tabla upload_logs para la Opción 1
CREATE TABLE upload_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL COMMENT 'Nombre del archivo cargado',
    upload_type VARCHAR(50) NOT NULL COMMENT 'Tipo de carga (ej: ADOL, DOL, ESTRUCTURA_ACADEMICA, etc.)',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la carga',
    bimestre_id INT COMMENT 'ID del bimestre asociado',
    status ENUM('Exitoso', 'Con errores', 'Error') NOT NULL COMMENT 'Estado de la carga',
    approval_status ENUM('Pendiente', 'Aprobado', 'Rechazado') NOT NULL DEFAULT 'Pendiente' COMMENT 'Estado de aprobación',
    approved_by INT NULL COMMENT 'Usuario que aprobó la carga',
    approved_at TIMESTAMP NULL COMMENT 'Fecha y hora de aprobación',
    is_processed BOOLEAN DEFAULT FALSE COMMENT 'Indica si los datos ya fueron procesados y las tablas vaciadas',
    processed_at TIMESTAMP NULL COMMENT 'Fecha y hora cuando se procesaron los datos',
    total_records INT DEFAULT 0 COMMENT 'Total de registros procesados',
    error_count INT DEFAULT 0 COMMENT 'Número de errores encontrados',
    user_id INT COMMENT 'Usuario que realizó la carga',
    error_details TEXT COMMENT 'Detalles de errores si los hay',
    
    -- Índices para consultas frecuentes
    INDEX idx_upload_date (upload_date),
    INDEX idx_upload_type (upload_type),
    INDEX idx_status (status),
    INDEX idx_bimestre_id (bimestre_id),
    
    -- Claves foráneas
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs de cargas de archivos - Opción 1';

-- Crear vista para la sección "Cargas Recientes"
CREATE VIEW v_cargas_recientes AS
SELECT 
    ul.file_name as archivo,
    CASE ul.upload_type
        WHEN 'ESTRUCTURA_ACADEMICA' THEN 'Estructura Académica'
        WHEN 'NOMINA_DOCENTES' THEN 'Nómina de Docentes'
        WHEN 'REPORTE_CURSABLES' THEN 'Reporte de Cursables'
        WHEN 'ADOL' THEN 'ADOL'
        WHEN 'DOL' THEN 'DOL'
        WHEN 'VACANTES_INICIO' THEN 'Vacantes de Inicio'
        WHEN 'PAYMENT_CODES' THEN 'Códigos de Pago'
        ELSE ul.upload_type
    END as tipo,
    DATE_FORMAT(ul.upload_date, '%d/%m/%Y, %H:%i:%s') as fecha,
    b.nombre as bimestre,
    ul.status as estado,
     ul.approval_status as estado_aprobacion,
     ul.is_processed as procesado,
     CASE 
         WHEN ul.error_count > 0 THEN CONCAT(ul.total_records, ' (', ul.error_count, ' errores)')
         ELSE ul.total_records
     END as registros,
    ul.upload_date as fecha_ordenamiento
FROM upload_logs ul
LEFT JOIN bimestres b ON ul.bimestre_id = b.id
ORDER BY ul.upload_date DESC
LIMIT 50;

-- Insertar datos de ejemplo que coincidan con la imagen
INSERT INTO upload_logs (
    file_name, upload_type, bimestre_id, status, approval_status,
    total_records, error_count, user_id, upload_date
) VALUES 
(
    'estructura_academica_2025.xlsx', 'ESTRUCTURA_ACADEMICA', 1, 'Exitoso', 'Aprobado',
    245, 0, 1, '2024-06-14 10:30:00'
),
(
    'nomina_docentes_semestre1.xlsx', 'NOMINA_DOCENTES', 1, 'Con errores', 'Pendiente',
    89, 3, 1, '2024-06-13 15:45:00'
),
(
    'reporte_cursables_ing.xlsx', 'REPORTE_CURSABLES', 2, 'Exitoso', 'Pendiente',
    156, 0, 1, '2024-06-12 09:15:00'
);

-- Comentarios para implementación:
-- 1. Modificar uploads.service.ts para insertar registros en esta tabla
-- 2. Agregar método logUpload() en el servicio
-- 3. Llamar a logUpload() al final de cada método de carga
-- 4. Implementar endpoint para aprobar cargas (actualizar approval_status)
-- 5. Implementar proceso de vaciado de tablas temporales (actualizar is_processed)
-- 6. El frontend consultará la vista v_cargas_recientes
-- 7. Los botones "Ver" y "Aprobar" se deshabilitan cuando is_processed = TRUE
-- 8. El botón "Aprobar" cambia a "Aprobado" cuando approval_status = 'Aprobado'