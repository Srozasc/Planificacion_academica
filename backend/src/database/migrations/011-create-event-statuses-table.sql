-- Migración: 011-create-event-statuses-table.sql
-- Descripción: Tabla para los estados de eventos de programación académica
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica

CREATE TABLE IF NOT EXISTS event_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único del estado',
    
    -- Información del estado
    name VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nombre del estado (Borrador, En Revisión, etc.)',
    description TEXT NULL COMMENT 'Descripción detallada del estado',
    
    -- Configuración del estado
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el estado está activo para usar',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización',
    
    -- Color para UI (opcional)
    color_hex VARCHAR(7) NULL COMMENT 'Color hexadecimal para representar el estado (#RRGGBB)',
    
    -- Configuración de permisos
    can_edit BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si los eventos en este estado pueden editarse',
    can_delete BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si los eventos en este estado pueden eliminarse',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    
    -- Índices para optimización
    INDEX idx_event_statuses_active (is_active),
    INDEX idx_event_statuses_sort (sort_order)
) 
ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci 
COMMENT='Estados disponibles para eventos de programación académica';
