-- Migración: 009-create-payment-codes-table.sql
-- Descripción: Tabla de códigos de pago con factores para cálculos salariales
-- Fecha: 2025-06-16

CREATE TABLE IF NOT EXISTS payment_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del código
    code_name VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código único de pago (Ej: DOC1, ASI2, etc.)',
    description VARCHAR(255) NOT NULL COMMENT 'Descripción del código de pago',
    
    -- Factor y cálculos
    factor DECIMAL(8,4) NOT NULL DEFAULT 1.0000 COMMENT 'Factor multiplicador para cálculos salariales',
    base_amount DECIMAL(10,2) NULL COMMENT 'Monto base en pesos chilenos',
    
    -- Categorización
    category ENUM('docente', 'administrativo', 'otro') NOT NULL DEFAULT 'docente' COMMENT 'Categoría del código',
    type ENUM('categoria', 'contrato', 'bono', 'descuento', 'hora') NOT NULL COMMENT 'Tipo de código de pago',
    
    -- Configuración
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el código está activo',
    requires_hours BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si requiere especificar horas',
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si está afecto a impuestos',
    
    -- Validez temporal
    valid_from DATE NULL COMMENT 'Fecha desde la cual es válido',
    valid_until DATE NULL COMMENT 'Fecha hasta la cual es válido',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Índices para optimización
    INDEX idx_payment_codes_code_name (code_name),
    INDEX idx_payment_codes_category (category),
    INDEX idx_payment_codes_type (type),
    INDEX idx_payment_codes_is_active (is_active),
    INDEX idx_payment_codes_validity (valid_from, valid_until),
    
    -- Constraints
    CONSTRAINT chk_factor_positive CHECK (factor > 0),
    CONSTRAINT chk_base_amount_positive CHECK (base_amount IS NULL OR base_amount >= 0),
    CONSTRAINT chk_valid_dates CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Códigos de pago con factores para cálculos salariales y categorización';

-- Insertar códigos de categorías docentes
INSERT INTO payment_codes (
    code_name, description, factor, base_amount, category, type, is_active, requires_hours
) VALUES 
-- Categorías Docentes
('DOC1', 'Profesor Titular', 1.5000, 2500000.00, 'docente', 'categoria', TRUE, FALSE),
('DOC2', 'Profesor Asociado', 1.3000, 2200000.00, 'docente', 'categoria', TRUE, FALSE),
('DOC3', 'Profesor Asistente', 1.1000, 1800000.00, 'docente', 'categoria', TRUE, FALSE),
('DOC4', 'Profesor Instructor', 1.0000, 1500000.00, 'docente', 'categoria', TRUE, FALSE),
('DOC5', 'Profesor Hora', 0.8000, 25000.00, 'docente', 'categoria', TRUE, TRUE),

-- Tipos de Contrato
('CONT1', 'Contrato Indefinido', 1.0000, NULL, 'docente', 'contrato', TRUE, FALSE),
('CONT2', 'Contrato a Plazo Fijo', 0.9500, NULL, 'docente', 'contrato', TRUE, FALSE),
('CONT3', 'Honorarios', 0.9000, NULL, 'docente', 'contrato', TRUE, FALSE),
('CONT4', 'Reemplazo', 0.8500, NULL, 'docente', 'contrato', TRUE, FALSE),

-- Bonos y Asignaciones
('BON1', 'Bono Coordinación', 1.0000, 300000.00, 'docente', 'bono', TRUE, FALSE),
('BON2', 'Bono Investigación', 1.0000, 200000.00, 'docente', 'bono', TRUE, FALSE),
('BON3', 'Bono Extensión', 1.0000, 150000.00, 'docente', 'bono', TRUE, FALSE),
('BON4', 'Bono Perfeccionamiento', 1.0000, 100000.00, 'docente', 'bono', TRUE, FALSE),

-- Horas Académicas
('HORA1', 'Hora Cátedra Diurna', 1.0000, 15000.00, 'docente', 'hora', TRUE, TRUE),
('HORA2', 'Hora Cátedra Vespertina', 1.1000, 15000.00, 'docente', 'hora', TRUE, TRUE),
('HORA3', 'Hora Cátedra Nocturna', 1.2000, 15000.00, 'docente', 'hora', TRUE, TRUE),
('HORA4', 'Hora Laboratorio', 1.3000, 15000.00, 'docente', 'hora', TRUE, TRUE),

-- Descuentos
('DESC1', 'Descuento por Atraso', 0.9800, NULL, 'docente', 'descuento', TRUE, FALSE),
('DESC2', 'Descuento por Falta', 0.9500, NULL, 'docente', 'descuento', TRUE, FALSE),

-- Códigos Administrativos
('ADM1', 'Coordinador Académico', 1.2000, 1800000.00, 'administrativo', 'categoria', TRUE, FALSE),
('ADM2', 'Secretario Académico', 1.0000, 1200000.00, 'administrativo', 'categoria', TRUE, FALSE),
('ADM3', 'Asistente Administrativo', 0.8000, 800000.00, 'administrativo', 'categoria', TRUE, FALSE);
