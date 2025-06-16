-- Migración: 008-create-teachers-table.sql
-- Descripción: Tabla de docentes con información personal, académica y contractual
-- Fecha: 2025-06-16

CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información personal
    rut VARCHAR(12) NOT NULL UNIQUE COMMENT 'RUT del docente (formato: 12345678-9)',
    name VARCHAR(255) NOT NULL COMMENT 'Nombre completo del docente',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email institucional del docente',
    phone VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
    address TEXT NULL COMMENT 'Dirección de residencia',
    
    -- Información académica
    academic_degree VARCHAR(100) NULL COMMENT 'Título académico (Ej: Magíster, Doctor)',
    specialization VARCHAR(255) NULL COMMENT 'Área de especialización',
    university VARCHAR(255) NULL COMMENT 'Universidad de origen del título',
    
    -- Información contractual
    category_id INT NULL COMMENT 'ID de categoría docente (FK a payment_codes)',
    contract_type_id INT NULL COMMENT 'ID tipo de contrato (FK a payment_codes)',
    hire_date DATE NULL COMMENT 'Fecha de contratación',
    contract_hours INT NULL COMMENT 'Horas contractuales por semana',
    salary_base DECIMAL(10,2) NULL COMMENT 'Salario base mensual',
    
    -- Estado y configuración
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el docente está activo',
    can_coordinate BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si puede coordinar programas',
    max_hours_per_week INT DEFAULT 40 COMMENT 'Máximo de horas semanales que puede dictar',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Índices para optimización
    INDEX idx_teachers_rut (rut),
    INDEX idx_teachers_email (email),
    INDEX idx_teachers_category (category_id),
    INDEX idx_teachers_contract_type (contract_type_id),
    INDEX idx_teachers_is_active (is_active),
    INDEX idx_teachers_can_coordinate (can_coordinate),
    INDEX idx_teachers_hire_date (hire_date),
    
    -- Foreign Keys (comentadas hasta implementar payment_codes)
    -- FOREIGN KEY (category_id) REFERENCES payment_codes(id) ON DELETE SET NULL,
    -- FOREIGN KEY (contract_type_id) REFERENCES payment_codes(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Nómina de docentes con información personal, académica y contractual';

-- Insertar datos de ejemplo
INSERT INTO teachers (
    rut, name, email, phone, academic_degree, specialization, 
    university, contract_hours, is_active, can_coordinate, max_hours_per_week
) VALUES 
(
    '12345678-9', 
    'Dr. Juan Carlos Pérez', 
    'juan.perez@planificacion.edu', 
    '+56912345678',
    'Doctor en Ciencias de la Computación',
    'Inteligencia Artificial y Machine Learning',
    'Universidad de Chile',
    40,
    TRUE,
    TRUE,
    40
),
(
    '98765432-1', 
    'Mg. María Elena González', 
    'maria.gonzalez@planificacion.edu', 
    '+56987654321',
    'Magíster en Ingeniería de Software',
    'Desarrollo de Software y Bases de Datos',
    'Pontificia Universidad Católica',
    20,
    TRUE,
    FALSE,
    30
),
(
    '11223344-5', 
    'Ing. Roberto Silva', 
    'roberto.silva@planificacion.edu', 
    '+56911223344',
    'Ingeniero en Sistemas',
    'Redes y Telecomunicaciones',
    'Universidad Técnica Federico Santa María',
    30,
    TRUE,
    TRUE,
    35
),
(
    '55667788-9', 
    'Dra. Ana María Torres', 
    'ana.torres@planificacion.edu', 
    '+56955667788',
    'Doctora en Matemáticas',
    'Matemáticas Aplicadas y Estadística',
    'Universidad de Santiago',
    25,
    TRUE,
    FALSE,
    30
),
(
    '99887766-5', 
    'Mg. Carlos Eduardo Ramos', 
    'carlos.ramos@planificacion.edu', 
    '+56999887766',
    'Magíster en Gestión de Proyectos',
    'Gestión de Proyectos TI y Metodologías Ágiles',
    'Universidad de los Andes',
    15,
    TRUE,
    FALSE,
    25
);
