-- =====================================================
-- Script: Creación de tabla cleanup_logs
-- Propósito: Tabla de auditoría para el SP sp_cleanup_old_bimestres
-- Fecha: 2025-01-17
-- =====================================================

USE planificacion_academica;

-- Crear tabla de logs para auditoría del cleanup
CREATE TABLE IF NOT EXISTS cleanup_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información de la ejecución
    execution_id VARCHAR(36) NOT NULL COMMENT 'UUID único para cada ejecución del SP',
    execution_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de inicio de la ejecución',
    execution_end_date DATETIME NULL COMMENT 'Fecha y hora de finalización de la ejecución',
    
    -- Parámetros de entrada
    months_threshold INT NOT NULL COMMENT 'Parámetro: meses de antigüedad para considerar bimestres obsoletos',
    max_bimestres_per_execution INT NOT NULL COMMENT 'Parámetro: máximo número de bimestres a eliminar por ejecución',
    debug_mode BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Parámetro: si se ejecutó en modo debug (sin eliminaciones reales)',
    perform_backup BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Parámetro: si se realizó backup antes de la eliminación',
    
    -- Resultados de la ejecución
    status ENUM('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK') NOT NULL DEFAULT 'STARTED' COMMENT 'Estado de la ejecución',
    bimestres_identified INT DEFAULT 0 COMMENT 'Número de bimestres identificados para eliminación',
    bimestres_deleted INT DEFAULT 0 COMMENT 'Número de bimestres efectivamente eliminados',
    
    -- Contadores por tabla
    schedule_events_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de schedule_events',
    academic_structures_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de academic_structures',
    vacantes_inicio_permanente_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de vacantes_inicio_permanente',
    event_teachers_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de event_teachers',
    upload_logs_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de upload_logs',
    dol_aprobados_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de dol_aprobados',
    asignaturas_optativas_aprobadas_deleted INT DEFAULT 0 COMMENT 'Registros eliminados de asignaturas_optativas_aprobadas',
    
    -- Información de errores
    error_message TEXT NULL COMMENT 'Mensaje de error si la ejecución falló',
    error_code VARCHAR(50) NULL COMMENT 'Código de error específico',
    
    -- Información de backup
    backup_file_path VARCHAR(500) NULL COMMENT 'Ruta del archivo de backup generado',
    backup_size_mb DECIMAL(10,2) NULL COMMENT 'Tamaño del backup en MB',
    
    -- Métricas de rendimiento
    execution_time_seconds INT NULL COMMENT 'Tiempo total de ejecución en segundos',
    memory_usage_mb DECIMAL(10,2) NULL COMMENT 'Uso de memoria durante la ejecución',
    
    -- Información adicional
    bimestres_list TEXT NULL COMMENT 'Lista de IDs de bimestres procesados (JSON)',
    validation_errors TEXT NULL COMMENT 'Errores de validación encontrados (JSON)',
    warnings TEXT NULL COMMENT 'Advertencias generadas durante la ejecución (JSON)',
    
    -- Auditoría
    created_by VARCHAR(100) NOT NULL DEFAULT 'sp_cleanup_old_bimestres' COMMENT 'Usuario o proceso que creó el registro',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de auditoría para el proceso de limpieza de bimestres obsoletos';

-- Crear índices para optimizar consultas
CREATE INDEX idx_cleanup_logs_execution_date ON cleanup_logs(execution_date);
CREATE INDEX idx_cleanup_logs_status ON cleanup_logs(status);
CREATE INDEX idx_cleanup_logs_execution_id ON cleanup_logs(execution_id);
CREATE INDEX idx_cleanup_logs_created_at ON cleanup_logs(created_at);

-- Crear índice compuesto para consultas de monitoreo
CREATE INDEX idx_cleanup_logs_monitoring ON cleanup_logs(execution_date, status, bimestres_deleted);

-- Verificar la creación de la tabla
SELECT 
    TABLE_NAME,
    TABLE_COMMENT,
    ENGINE,
    TABLE_COLLATION
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'planificacion_academica' 
    AND TABLE_NAME = 'cleanup_logs';

-- Mostrar estructura de la tabla
DESCRIBE cleanup_logs;

-- Comentarios adicionales sobre el uso de la tabla:
-- 
-- 1. execution_id: Se genera un UUID único para cada ejecución del SP
-- 2. Los contadores *_deleted permiten rastrear exactamente qué se eliminó
-- 3. El campo bimestres_list almacena los IDs en formato JSON para auditoría completa
-- 4. Los campos de error permiten diagnóstico detallado de fallos
-- 5. Las métricas de rendimiento ayudan a optimizar futuras ejecuciones
-- 6. Los índices están optimizados para consultas de monitoreo y auditoría

-- Ejemplo de consulta para monitoreo:
-- SELECT execution_date, status, bimestres_deleted, execution_time_seconds
-- FROM cleanup_logs 
-- WHERE execution_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- ORDER BY execution_date DESC;