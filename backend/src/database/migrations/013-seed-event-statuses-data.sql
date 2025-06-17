-- Migración: 013-seed-event-statuses-data.sql
-- Descripción: Poblar tabla de estados de eventos con datos iniciales
-- Fecha: 2025-06-17
-- Autor: Sistema de Planificación Académica

-- Insertar estados base para eventos de programación académica
INSERT INTO event_statuses (id, name, description, is_active, sort_order, color_hex, can_edit, can_delete) VALUES
(1, 'Borrador', 'Evento en estado de borrador, puede ser editado libremente', TRUE, 10, '#6c757d', TRUE, TRUE),
(2, 'En Revisión', 'Evento enviado para revisión por coordinación académica', TRUE, 20, '#ffc107', FALSE, FALSE),
(3, 'Aprobado', 'Evento aprobado y confirmado en el calendario académico', TRUE, 30, '#28a745', FALSE, FALSE),
(4, 'Rechazado', 'Evento rechazado, requiere modificaciones', TRUE, 40, '#dc3545', TRUE, TRUE),
(5, 'Suspendido', 'Evento temporalmente suspendido', TRUE, 50, '#fd7e14', FALSE, FALSE),
(6, 'Cancelado', 'Evento cancelado definitivamente', TRUE, 60, '#6f42c1', FALSE, FALSE),
(7, 'Programado', 'Evento programado y listo para ejecutar', TRUE, 35, '#17a2b8', FALSE, FALSE)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order),
    color_hex = VALUES(color_hex),
    can_edit = VALUES(can_edit),
    can_delete = VALUES(can_delete),    updated_at = CURRENT_TIMESTAMP;
