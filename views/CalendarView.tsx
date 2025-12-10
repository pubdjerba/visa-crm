import React, { useState } from 'react';
import { Client, TodoTask } from '../types';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';

interface CalendarViewProps {
  clients: Client[];
  tasks?: TodoTask[];
  onSelectClient?: (clientId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ clients, tasks = [], onSelectClient }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday start (0 = Sunday, we want 0 = Monday)
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year;
  };

  const getEventsForDay = (day: number) => {
    const appointments = clients.flatMap(c => c.applications)
      .filter(a => {
        if (!a.appointmentDate) return false;
        const appDate = new Date(a.appointmentDate);
        return appDate.getDate() === day &&
          appDate.getMonth() === month &&
          appDate.getFullYear() === year;
      })
      .map(a => {
        const client = clients.find(c => c.applications.includes(a));
        return {
          type: 'appointment' as const,
          clientId: client?.id,
          clientName: client?.fullName,
          destination: a.destination,
          time: a.appointmentDate ? new Date(a.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '09:00'
        };
      });

    const dayTasks = tasks
      .filter(t => !t.completed && t.createdAt)
      .filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate.getDate() === day &&
          taskDate.getMonth() === month &&
          taskDate.getFullYear() === year;
      })
      .map(t => ({
        type: 'task' as const,
        text: t.text
      }));

    return [...appointments, ...dayTasks];
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          Calendrier RDV
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex-grow overflow-hidden flex flex-col">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
            {monthName}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition flex items-center justify-center w-10 h-10 border border-slate-200 dark:border-slate-600"
            >
              <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              Aujourd'hui
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition flex items-center justify-center w-10 h-10 border border-slate-200 dark:border-slate-600"
            >
              <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-grow overflow-y-auto">
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Day headers */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="bg-slate-50 dark:bg-slate-800 p-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}

            {/* Padding days */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`padding-${i}`} className="bg-slate-50 dark:bg-slate-900/50 h-32"></div>
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const events = getEventsForDay(day);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day}
                  className={`bg-white dark:bg-slate-800 h-32 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition relative group ${isTodayDate ? 'ring-2 ring-orange-500 dark:ring-orange-400 ring-inset' : ''
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${isTodayDate
                        ? 'text-orange-600 dark:text-orange-400'
                        : events.length > 0
                          ? 'text-slate-800 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                      {day}
                    </span>
                    {isTodayDate && (
                      <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
                        AUJOURD'HUI
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-y-auto max-h-[88px]">
                    {events.map((evt, idx) => (
                      evt.type === 'appointment' ? (
                        <div
                          key={idx}
                          className="group/item hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 py-0.5 rounded transition cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (evt.clientId && onSelectClient) {
                              onSelectClient(evt.clientId);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="font-bold text-blue-700 dark:text-blue-400">{evt.time}</span>
                            <span className="text-slate-600 dark:text-slate-400">•</span>
                            <span className="text-slate-700 dark:text-slate-300 truncate">{evt.destination}</span>
                          </div>
                          <div className="text-[9px] text-blue-600 dark:text-blue-400 font-medium truncate group-hover/item:underline">
                            {evt.clientName}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={idx}
                          className="px-1 py-0.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                        >
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-green-600 dark:text-green-400">📋</span>
                            <span className="text-slate-700 dark:text-slate-300 truncate">{evt.text}</span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
            <span className="text-slate-600 dark:text-slate-400">Rendez-vous (cliquez pour voir le client)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full"></div>
            <span className="text-slate-600 dark:text-slate-400">Tâches</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-orange-500 dark:border-orange-400 rounded-full"></div>
            <span className="text-slate-600 dark:text-slate-400">Aujourd'hui</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;