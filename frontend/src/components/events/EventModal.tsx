import React, { useState, useEffect } from 'react';
import { dropdownService, Teacher, Subject } from '../../services/dropdownService';
import { eventService } from '../../services/event.service';
import { useBimestreStore } from '../../store/bimestre.store';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSave: (eventData: CreateEventData) => void;
  isLoading?: boolean;
  onMultipleEventsCreated?: () => Promise<void> | void;
  editingEvent?: {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    extendedProps?: {
      teacher?: string;
      teacher_ids?: number[];
      room?: string;
      students?: number;
      subject?: string;
    };
  } | null;
}

export interface CreateEventData {
  title: string;
  startDate: string;
  endDate: string;
  teacher?: string; // Mantenido por compatibilidad
  teacher_ids?: number[]; // Nuevo campo para múltiples docentes
  subject?: string;
  students?: number;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSave,
  isLoading = false,
  onMultipleEventsCreated,
  editingEvent
}) => {
  const { bimestreSeleccionado } = useBimestreStore();

  // Función helper para convertir fecha del bimestre a formato YYYY-MM-DD para inputs
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Función para parsear fechas sin problemas de zona horaria
      const parseLocalDate = (dateString: string): Date => {
        const date = new Date(dateString + 'T00:00:00');
        return date;
      };
      
      const date = parseLocalDate(dateString);
      // Convertir a formato YYYY-MM-DD para inputs
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  };

  // Función para obtener las fechas por defecto del bimestre
  const getDefaultDates = () => {
    console.log('getDefaultDates - bimestreSeleccionado:', bimestreSeleccionado);
    if (bimestreSeleccionado) {
      const formattedStartDate = formatDateForInput(bimestreSeleccionado.fechaInicio);
      const formattedEndDate = formatDateForInput(bimestreSeleccionado.fechaFin);
      
      console.log('Fechas del bimestre originales:', {
        startDate: bimestreSeleccionado.fechaInicio,
        endDate: bimestreSeleccionado.fechaFin
      });
      console.log('Fechas del bimestre formateadas:', {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
      
      return {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      };
    }
    console.log('No hay bimestre seleccionado, usando fechas vacías');
    return {
      startDate: '',
      endDate: ''
    };
  };

  const [formData, setFormData] = useState<CreateEventData>(() => {
    const defaultDates = getDefaultDates();
    console.log('Inicializando formData con fechas:', defaultDates);
    return {
      title: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      teacher: '',
      teacher_ids: [],
      subject: '',
      students: 0
    };
  });

  const [eventCounter, setEventCounter] = useState(1);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [enableDateEditing, setEnableDateEditing] = useState(false);
  const [enableMultipleEvents, setEnableMultipleEvents] = useState(false);
  const [eventQuantity, setEventQuantity] = useState(1);

  // Cargar datos de las listas desplegables cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  // Actualizar fechas cuando cambie el bimestre seleccionado o se abra el modal
  useEffect(() => {
    console.log('useEffect bimestre - bimestreSeleccionado:', bimestreSeleccionado);
    console.log('useEffect bimestre - editingEvent:', editingEvent);
    console.log('useEffect bimestre - selectedDate:', selectedDate);
    console.log('useEffect bimestre - isOpen:', isOpen);
    
    // Solo actualizar fechas si el modal está abierto, hay bimestre seleccionado,
    // y no estamos editando un evento ni hay fecha seleccionada
    if (isOpen && bimestreSeleccionado && !editingEvent && !selectedDate) {
      console.log('Actualizando fechas del formulario con bimestre:', {
        startDate: bimestreSeleccionado.fechaInicio,
        endDate: bimestreSeleccionado.fechaFin
      });
      
      setFormData(prev => {
        console.log('Estado anterior del formulario:', prev);
        const newFormData = {
          ...prev,
          startDate: bimestreSeleccionado.fechaInicio,
          endDate: bimestreSeleccionado.fechaFin
        };
        console.log('Nuevo estado del formulario:', newFormData);
        return newFormData;
      });
    }
  }, [bimestreSeleccionado, editingEvent, selectedDate, isOpen]);

  const loadDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [teachersData, subjectsData] = await Promise.all([
        dropdownService.getTeachers(),
        dropdownService.getSubjects()
      ]);
      setTeachers(teachersData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Función para generar el título automáticamente
  const generateTitle = (subjectName: string, counter: number) => {
    if (!subjectName) return '';
    const paddedCounter = counter.toString().padStart(3, '0');
    
    // Buscar la asignatura seleccionada para obtener su código/sigla
    const selectedSubject = subjects.find(subject => subject.name === subjectName);
    const subjectCode = selectedSubject?.code || '';
    
    // Incluir la sigla antes del nombre de la asignatura
    return subjectCode 
      ? `${subjectCode} - ${subjectName} - ${paddedCounter}`
      : `${subjectName} - ${paddedCounter}`;
  };

  // Actualizar título cuando cambie la asignatura
  useEffect(() => {
    const updateTitle = async () => {
      if (formData.subject && !editingEvent) {
        try {
          const nextCorrelative = await eventService.getNextCorrelativeForSubject(formData.subject);
          const newTitle = generateTitle(formData.subject, nextCorrelative);
          setFormData(prev => ({ ...prev, title: newTitle }));
          setEventCounter(nextCorrelative);
        } catch (error) {
          console.error('Error getting next correlative:', error);
          // Usar correlativo por defecto en caso de error
          const newTitle = generateTitle(formData.subject, 1);
          setFormData(prev => ({ ...prev, title: newTitle }));
          setEventCounter(1);
        }
      }
    };
    
    updateTitle();
  }, [formData.subject]);

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        // Función para parsear fechas sin problemas de zona horaria
        const parseLocalDate = (dateString: string): Date => {
          const date = new Date(dateString + 'T00:00:00');
          return date;
        };
        
        // Extraer datos del evento para editar
        const startDate = parseLocalDate(editingEvent.start.split('T')[0]);
        const endDate = parseLocalDate(editingEvent.end.split('T')[0]);
        
        // Extraer el correlativo del título existente si es posible
        const titleMatch = editingEvent.title.match(/ - (\d{3})$/);
        const existingCounter = titleMatch ? parseInt(titleMatch[1]) : 1;
        
        setFormData({
          title: editingEvent.title,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          teacher: editingEvent.extendedProps?.teacher || '',
          teacher_ids: editingEvent.extendedProps?.teacher_ids || [], // Cargar los IDs de docentes
          subject: editingEvent.extendedProps?.subject || '',
          students: editingEvent.extendedProps?.students || 0
        });
        
        setEventCounter(existingCounter);
      } else if (selectedDate) {
        // Crear nuevo evento con fecha seleccionada
        const dateString = selectedDate.toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          startDate: dateString,
          endDate: dateString
        }));
      } else {
        // Crear nuevo evento con fechas por defecto del bimestre
        // Usar setTimeout para asegurar que el bimestre esté disponible
        setTimeout(() => {
          const defaultDates = getDefaultDates();
          console.log('Inicializando formulario con fechas por defecto (setTimeout):', defaultDates);
          setFormData({
            title: '',
            startDate: defaultDates.startDate,
            endDate: defaultDates.endDate,
            teacher: '',
            teacher_ids: [],
            subject: '',
            students: 0
          });
        }, 100);
      }
    }
  }, [isOpen, selectedDate, editingEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors: Record<string, string> = {};
    
    if (!formData.subject || !formData.subject.trim()) {
      newErrors.subject = 'La asignatura es requerida';
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
    
    if (enableMultipleEvents && (eventQuantity < 1 || eventQuantity > 20)) {
      newErrors.eventQuantity = 'La cantidad debe estar entre 1 y 20 eventos';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (enableMultipleEvents && eventQuantity > 1) {
        await handleMultipleEventCreation();
      } else {
        onSave(formData);
      }
    }
  };

  const handleMultipleEventCreation = async () => {
    try {
      console.log(`Iniciando creación de ${eventQuantity} eventos múltiples...`);
      
      let createdCount = 0;
      
      // Crear múltiples eventos secuencialmente con delays
      for (let i = 0; i < eventQuantity; i++) {
        // Obtener correlativo dinámicamente para cada evento para evitar conflictos
        const currentCorrelative = await eventService.getNextCorrelativeForSubject(formData.subject!);
        const eventTitle = generateTitle(formData.subject!, currentCorrelative);
        
        const eventData = {
          ...formData,
          title: eventTitle
        };
        
        console.log(`🚀 Creando evento ${i + 1}/${eventQuantity}:`, {
          title: eventTitle,
          correlativo: currentCorrelative,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          subject: eventData.subject
        });
        
        try {
          // Para múltiples eventos, creamos directamente usando el servicio
          const createdEvent = await eventService.createEvent(eventData);
          createdCount++;
          console.log(`✅ Evento ${i + 1} creado exitosamente:`, {
            id: createdEvent.id,
            title: createdEvent.title,
            start: createdEvent.start,
            end: createdEvent.end
          });
          
          // Agregar delay entre creaciones para evitar problemas de concurrencia
          if (i < eventQuantity - 1) {
            console.log('Esperando 200ms antes del siguiente evento...');
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (eventError) {
          console.error(`Error creando evento ${i + 1}:`, eventError);
          // Continuar con los siguientes eventos aunque uno falle
        }
      }
      
      console.log(`${createdCount}/${eventQuantity} eventos creados exitosamente. Cerrando modal...`);
      
      // Después de crear todos los eventos exitosamente, cerramos el modal
      handleClose();
      
      // Agregar delay más largo para asegurar que todas las transacciones se confirmen
      setTimeout(async () => {
        console.log('Notificando al componente padre para recargar eventos...');
        // Notificar al componente padre que se han creado múltiples eventos
        if (onMultipleEventsCreated) {
          await onMultipleEventsCreated();
        }
      }, 1000); // Delay de 1000ms para mayor seguridad
      
    } catch (error) {
      console.error('Error creating multiple events:', error);
      throw error;
    }
  };

  const handleClose = () => {
    const defaultDates = getDefaultDates();
    console.log('handleClose - reseteando formulario con fechas:', defaultDates);
    setFormData({
      title: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      teacher: '',
      teacher_ids: [],
      subject: '',
      students: 0
    });
    setErrors({});
    setEventCounter(1);
    setTeacherSearchTerm(''); // Limpiar búsqueda de docentes
    setSubjectSearchTerm(''); // Limpiar búsqueda de asignaturas
    setEnableDateEditing(false); // Resetear checkbox de edición de fechas
    setEnableMultipleEvents(false); // Resetear checkbox de eventos múltiples
    setEventQuantity(1); // Resetear cantidad de eventos
    onClose();
  };



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
          {/* Título generado automáticamente */}
          {formData.title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Evento (Generado automáticamente)
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                {formData.title}
              </div>
              <p className="text-gray-500 text-sm mt-1">El título se genera automáticamente basado en la asignatura seleccionada</p>
            </div>
          )}



          {/* Checkbox para habilitar edición de fechas */}
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableDateEditing}
                onChange={(e) => setEnableDateEditing(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Permitir edición de fechas
              </span>
            </label>
            <p className="text-gray-500 text-xs mt-1 ml-6">
              Por defecto, las fechas se establecen según el bimestre actual
            </p>
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
                disabled={!enableDateEditing}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                } ${!enableDateEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              {!enableDateEditing && (
                <p className="text-gray-500 text-xs mt-1">
                  Fecha establecida automáticamente según el bimestre
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={!enableDateEditing}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                } ${!enableDateEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              {!enableDateEditing && (
                <p className="text-gray-500 text-xs mt-1">
                  Fecha establecida automáticamente según el bimestre
                </p>
              )}
            </div>
          </div>



          {/* Detalles adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignatura *
              </label>
              
              {/* Campo de búsqueda */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar asignatura por nombre o código..."
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isLoadingDropdowns}
                />
              </div>
              
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                {isLoadingDropdowns ? (
                  <p className="text-gray-500 text-sm">Cargando asignaturas...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay asignaturas disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {subjects
                      .filter(subject => {
                        const searchLower = subjectSearchTerm.toLowerCase();
                        return subject.name.toLowerCase().includes(searchLower) ||
                               subject.code.toLowerCase().includes(searchLower);
                      })
                      .map((subject) => (
                        <label key={subject.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="radio"
                            name="subject"
                            checked={formData.subject === subject.name}
                            onChange={() => {
                              setFormData(prev => ({ ...prev, subject: subject.name }));
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {subject.code} - {subject.name}
                          </span>
                        </label>
                      ))
                    }
                    {subjects.filter(subject => {
                      const searchLower = subjectSearchTerm.toLowerCase();
                      return subject.name.toLowerCase().includes(searchLower) ||
                             subject.code.toLowerCase().includes(searchLower);
                    }).length === 0 && subjectSearchTerm && (
                      <p className="text-gray-500 text-sm italic">No se encontraron asignaturas que coincidan con la búsqueda</p>
                    )}
                  </div>
                )}
              </div>
              {formData.subject && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Asignatura seleccionada: <span className="font-medium">{formData.subject}</span>
                  </p>
                </div>
              )}
              {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Docentes
              </label>
              
              {/* Campo de búsqueda */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Buscar docente por nombre o RUT..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isLoadingDropdowns}
                />
              </div>
              
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                {isLoadingDropdowns ? (
                  <p className="text-gray-500 text-sm">Cargando docentes...</p>
                ) : teachers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay docentes disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {teachers
                      .filter(teacher => {
                        const searchLower = teacherSearchTerm.toLowerCase();
                        return teacher.name.toLowerCase().includes(searchLower) ||
                               teacher.rut.toLowerCase().includes(searchLower);
                      })
                      .map((teacher) => (
                        <label key={teacher.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.teacher_ids?.includes(teacher.id) || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormData(prev => {
                                const currentIds = prev.teacher_ids || [];
                                const newIds = isChecked
                                  ? [...currentIds, teacher.id]
                                  : currentIds.filter(id => id !== teacher.id);
                                
                                // Mantener compatibilidad con el campo teacher
                                const firstTeacher = newIds.length > 0 
                                  ? teachers.find(t => t.id === newIds[0])?.name || ''
                                  : '';
                                
                                return {
                                  ...prev,
                                  teacher_ids: newIds,
                                  teacher: firstTeacher
                                };
                              });
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {teacher.name} - {teacher.rut}
                          </span>
                        </label>
                      ))
                    }
                    {teachers.filter(teacher => {
                      const searchLower = teacherSearchTerm.toLowerCase();
                      return teacher.name.toLowerCase().includes(searchLower) ||
                             teacher.rut.toLowerCase().includes(searchLower);
                    }).length === 0 && teacherSearchTerm && (
                      <p className="text-gray-500 text-sm italic">No se encontraron docentes que coincidan con la búsqueda</p>
                    )}
                  </div>
                )}
              </div>
              {formData.teacher_ids && formData.teacher_ids.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {formData.teacher_ids.length} docente(s) seleccionado(s)
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.teacher_ids.map(teacherId => {
                      const teacher = teachers.find(t => t.id === teacherId);
                      return teacher ? (
                        <span key={teacherId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {teacher.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const newIds = (prev.teacher_ids || []).filter(id => id !== teacherId);
                                const firstTeacher = newIds.length > 0 
                                  ? teachers.find(t => t.id === newIds[0])?.name || ''
                                  : '';
                                return {
                                  ...prev,
                                  teacher_ids: newIds,
                                  teacher: firstTeacher
                                };
                              });
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Número de Estudiantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Creación Múltiple de Eventos */}
          {!editingEvent && (
            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="enableMultipleEvents"
                  checked={enableMultipleEvents}
                  onChange={(e) => {
                    setEnableMultipleEvents(e.target.checked);
                    if (!e.target.checked) {
                      setEventQuantity(1);
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="enableMultipleEvents" className="text-sm font-medium text-gray-700">
                  Crear múltiples eventos de la misma asignatura
                </label>
              </div>
              
              {enableMultipleEvents && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad de eventos a crear
                    </label>
                    <input
                      type="number"
                      value={eventQuantity}
                      onChange={(e) => setEventQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                      min="1"
                      max="20"
                    />
                    {errors.eventQuantity && (
                      <p className="text-red-500 text-sm mt-1">{errors.eventQuantity}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Los eventos se crearán con correlativos incrementales automáticamente
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  {editingEvent ? 'Actualizando...' : (enableMultipleEvents && eventQuantity > 1 ? `Creando ${eventQuantity} eventos...` : 'Guardando...')}
                </>
              ) : (
                editingEvent ? 'Actualizar Evento' : (enableMultipleEvents && eventQuantity > 1 ? `Crear ${eventQuantity} Eventos` : 'Crear Evento')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
