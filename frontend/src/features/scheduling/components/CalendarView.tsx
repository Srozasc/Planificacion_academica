import React from 'react';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  extendedProps?: {
    teacher?: string;
    room?: string;
    students?: number;
  };
}

interface CalendarViewProps {
  events: Event[];
  view: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, view }) => {
  // Simulación de calendario con vista básica
  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const days = [];
    // Días del mes anterior
    for (let i = startDate; i > 0; i--) {
      const prevMonthDay = new Date(year, month, -i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDay
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: currentDate
      });
    }

    // Días del siguiente mes para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: nextMonthDay
      });
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const weekDaysShort = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // Para móvil
  const currentDate = new Date();
  const days = getDaysInMonth();

  if (view === 'month') {
    return (      <div className="calendar-view">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <span className="hidden sm:inline">← Anterior</span>
              <span className="sm:hidden">←</span>
            </button>
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <span className="hidden sm:inline">Siguiente →</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
          <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium">
            Hoy
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 bg-gray-50">
            {weekDays.map((day, index) => (
              <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{weekDaysShort[index]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day.fullDate);
              const isToday = day.fullDate.toDateString() === new Date().toDateString();              return (
                <div
                  key={index}
                  className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-gray-200 last:border-r-0 ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {day.date}
                  </div>
                    {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: event.backgroundColor || '#3B82F6' }}
                        title={event.title}
                      >
                        <span className="hidden sm:inline">{event.title}</span>
                        <span className="sm:hidden text-center block">•</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 font-medium">
                        <span className="hidden sm:inline">+{dayEvents.length - 2} más</span>
                        <span className="sm:hidden text-center block">+{dayEvents.length - 2}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  // Vista de semana simplificada
  if (view === 'week') {
    return (
      <div className="calendar-view">
        <div className="text-center p-4 sm:p-8">
          <div className="text-4xl sm:text-6xl mb-4">📅</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Vista de Semana</h3>
          <p className="text-sm sm:text-base text-gray-600">Vista semanal del calendario</p>
          <div className="mt-4 p-3 sm:p-4 bg-gray-100 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-700">Esta vista se implementará con FullCalendar en la versión completa</p>
          </div>
        </div>
      </div>
    );
  }

  // Vista de día simplificada
  return (
    <div className="calendar-view">
      <div className="text-center p-4 sm:p-8">
        <div className="text-4xl sm:text-6xl mb-4">📋</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Vista de Día</h3>
        <p className="text-sm sm:text-base text-gray-600">Vista diaria del calendario</p>
        <div className="mt-4 p-3 sm:p-4 bg-gray-100 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-700">Esta vista se implementará con FullCalendar en la versión completa</p>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
