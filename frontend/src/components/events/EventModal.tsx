import React, { useState, useEffect } from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSave: (eventData: CreateEventData) => void;
  isLoading?: boolean;
  editingEvent?: {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    extendedProps?: {
      teacher?: string;
      room?: string;
      students?: number;
      subject?: string;
    };
  } | null;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  teacher?: string;
  subject?: string;
  room?: string;
  students?: number;
  backgroundColor?: string;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSave,
  isLoading = false,
  editingEvent
}) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '09:00',
    teacher: '',
    subject: '',
    room: '',
    students: 0,
    backgroundColor: '#3B82F6'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        // Extraer datos del evento para editar
        const startDate = new Date(editingEvent.start);
        const endDate = new Date(editingEvent.end);
        
        setFormData({
          title: editingEvent.title,
          description: '', // No tenemos description en CalendarEvent
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endTime: endDate.toTimeString().slice(0, 5),
          teacher: editingEvent.extendedProps?.teacher || '',
          subject: editingEvent.extendedProps?.subject || '',
          room: editingEvent.extendedProps?.room || '',
          students: editingEvent.extendedProps?.students || 0,
          backgroundColor: editingEvent.backgroundColor || '#3B82F6'
        });
      } else if (selectedDate) {
        // Crear nuevo evento con fecha seleccionada
        const dateString = selectedDate.toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          startDate: dateString,
          endDate: dateString
        }));
      }
    }
  }, [isOpen, selectedDate, editingEvent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'La fecha de fin es requerida';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '08:00',
      endTime: '09:00',
      teacher: '',
      subject: '',
      room: '',
      students: 0,
      backgroundColor: '#3B82F6'
    });
    setErrors({});
    onClose();
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul', color: 'bg-blue-500' },
    { value: '#10B981', label: 'Verde', color: 'bg-green-500' },
    { value: '#F59E0B', label: 'Amarillo', color: 'bg-yellow-500' },
    { value: '#EF4444', label: 'Rojo', color: 'bg-red-500' },
    { value: '#8B5CF6', label: 'Púrpura', color: 'bg-purple-500' },
    { value: '#06B6D4', label: 'Cian', color: 'bg-cyan-500' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">            <h2 className="text-xl font-semibold text-gray-900">
              {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Evento *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Clase de Matemáticas"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del evento..."
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Inicio
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Fin
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Docente
              </label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del docente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignatura
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la asignatura"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aula
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Aula 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Estudiantes
              </label>
              <input
                type="number"
                value={formData.students || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, students: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Color del evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color del Evento
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, backgroundColor: color.value }))}
                  className={`flex items-center px-3 py-2 rounded-md border-2 transition-colors ${
                    formData.backgroundColor === color.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded ${color.color} mr-2`}></div>
                  <span className="text-sm">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingEvent ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingEvent ? 'Actualizar Evento' : 'Crear Evento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
