import React, { useState } from 'react';
import { 
  ClockIcon, 
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import CalendarView from './components/CalendarView';

interface ScheduleItem {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  instructor: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string;
  endTime: string;
  room: string;
  capacity: number;
  enrolled: number;
  semester: string;
  credits: number;
}

const SchedulingPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');
  const [selectedSemester, setSelectedSemester] = useState('2024-1');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

  const mockSchedules: ScheduleItem[] = [
    {
      id: '1',
      courseCode: 'MAT-101',
      courseName: 'Matemáticas I',
      section: 'A',
      instructor: 'Dr. García',
      dayOfWeek: 1, // Lunes
      startTime: '08:00',
      endTime: '10:00',
      room: 'Aula 101',
      capacity: 40,
      enrolled: 35,
      semester: '2024-1',
      credits: 4
    },
    {
      id: '2',
      courseCode: 'FIS-201',
      courseName: 'Física II',
      section: 'B',
      instructor: 'Dra. López',
      dayOfWeek: 2, // Martes
      startTime: '10:00',
      endTime: '12:00',
      room: 'Lab. Física 1',
      capacity: 25,
      enrolled: 22,
      semester: '2024-1',
      credits: 3
    },
    {
      id: '3',
      courseCode: 'PROG-301',
      courseName: 'Programación Avanzada',
      section: 'A',
      instructor: 'Dr. Martínez',
      dayOfWeek: 3, // Miércoles
      startTime: '14:00',
      endTime: '16:00',
      room: 'Lab. Sistemas 2',
      capacity: 30,
      enrolled: 28,
      semester: '2024-1',
      credits: 4
    },
    {
      id: '4',
      courseCode: 'QUI-101',
      courseName: 'Química General',
      section: 'C',
      instructor: 'Dra. Rodríguez',
      dayOfWeek: 4, // Jueves
      startTime: '16:00',
      endTime: '18:00',
      room: 'Lab. Química 1',
      capacity: 20,
      enrolled: 18,
      semester: '2024-1',
      credits: 3
    },
    {
      id: '5',
      courseCode: 'ING-401',
      courseName: 'Inglés Técnico',
      section: 'A',
      instructor: 'Prof. Smith',
      dayOfWeek: 5, // Viernes
      startTime: '09:00',
      endTime: '11:00',
      room: 'Aula 205',
      capacity: 35,
      enrolled: 30,
      semester: '2024-1',
      credits: 2
    }
  ];

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const filteredSchedules = mockSchedules.filter(schedule => {
    const matchesSemester = schedule.semester === selectedSemester;
    const matchesDay = selectedDay === null || schedule.dayOfWeek === selectedDay;
    const matchesSearch = 
      schedule.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSemester && matchesDay && matchesSearch;
  });

  const handleNewSchedule = () => {
    console.log('Crear nuevo horario');
    // Aquí iría la lógica para abrir el modal de creación
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    console.log('Editar horario:', schedule);
    // Aquí iría la lógica para abrir el modal de edición
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este horario?')) {
      console.log('Eliminando horario:', scheduleId);
      // Aquí iría la lógica real de eliminación
    }
  };

  const getOccupancyColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return 'bg-red-100 text-red-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Docente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ocupación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.map(schedule => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.courseCode}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.courseName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.section}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.instructor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{daysOfWeek[schedule.dayOfWeek]}</div>
                    <div className="text-gray-500">{schedule.startTime} - {schedule.endTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.room}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOccupancyColor(schedule.enrolled, schedule.capacity)}`}>
                      {schedule.enrolled}/{schedule.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedSchedule(schedule)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Programación Académica</h1>
          <p className="text-gray-600">Gestiona los horarios y programación de cursos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">{mockSchedules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSchedules.reduce((sum, s) => sum + s.enrolled, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aulas en Uso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(mockSchedules.map(s => s.room)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Horas Semanales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSchedules.reduce((sum, s) => {
                    const start = parseInt(s.startTime.split(':')[0]);
                    const end = parseInt(s.endTime.split(':')[0]);
                    return sum + (end - start);
                  }, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Semester Filter */}
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024-1">2024-1</option>
                <option value="2024-2">2024-2</option>
                <option value="2023-2">2023-2</option>
              </select>

              {/* Day Filter */}
              <select
                value={selectedDay || ''}
                onChange={(e) => setSelectedDay(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los días</option>
                {daysOfWeek.slice(1, 7).map((day, index) => (
                  <option key={day} value={index + 1}>{day}</option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cursos, docentes, aulas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setSelectedView('calendar')}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedView === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Calendario
                </button>
                <button
                  onClick={() => setSelectedView('list')}
                  className={`px-4 py-2 text-sm font-medium border-l ${
                    selectedView === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Lista
                </button>
              </div>

              <button
                onClick={handleNewSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nuevo Horario
              </button>
            </div>
          </div>
        </div>        {/* Schedule View */}
        {selectedView === 'calendar' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <CalendarView 
              events={filteredSchedules.map(schedule => ({
                id: schedule.id,
                title: `${schedule.courseCode} - ${schedule.section}`,
                start: `2024-01-${(schedule.dayOfWeek + 7).toString().padStart(2, '0')}T${schedule.startTime}:00`,
                end: `2024-01-${(schedule.dayOfWeek + 7).toString().padStart(2, '0')}T${schedule.endTime}:00`,
                backgroundColor: '#3B82F6',
                extendedProps: {
                  teacher: schedule.instructor,
                  room: schedule.room,
                  students: schedule.enrolled
                }
              }))}
              view="week"
            />
          </div>
        ) : (
          renderListView()
        )}

        {/* Schedule Details Modal */}
        {selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalles del Horario
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Curso:</label>
                  <p className="text-gray-900">{selectedSchedule.courseCode} - {selectedSchedule.courseName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Sección:</label>
                  <p className="text-gray-900">{selectedSchedule.section}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Docente:</label>
                  <p className="text-gray-900">{selectedSchedule.instructor}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Horario:</label>
                  <p className="text-gray-900">
                    {daysOfWeek[selectedSchedule.dayOfWeek]} - {selectedSchedule.startTime} a {selectedSchedule.endTime}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Aula:</label>
                  <p className="text-gray-900">{selectedSchedule.room}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Ocupación:</label>
                  <p className="text-gray-900">{selectedSchedule.enrolled} / {selectedSchedule.capacity} estudiantes</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Créditos:</label>
                  <p className="text-gray-900">{selectedSchedule.credits}</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleEditSchedule(selectedSchedule)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulingPage;
