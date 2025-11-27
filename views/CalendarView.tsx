import React from 'react';
import { Client } from '../types';

interface CalendarViewProps {
    clients: Client[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ clients }) => {
  // Mock calendar generation for current month
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  
  const getEventsForDay = (day: number) => {
    return clients.flatMap(c => c.applications)
      .filter(a => a.appointmentDate && new Date(a.appointmentDate).getDate() === day)
      .map(a => ({
        client: clients.find(c => c.applications.includes(a))?.fullName,
        destination: a.destination,
        time: '09:00' // Mock time, real app would parse from date string
      }));
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Calendrier RDV</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Mois en cours</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded">&larr;</button>
            <button className="p-2 hover:bg-slate-100 rounded">&rarr;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500 uppercase">
              {d}
            </div>
          ))}
          
          {/* Padding days */}
          <div className="bg-white h-32"></div>
          <div className="bg-white h-32"></div>

          {days.map(day => {
            const events = getEventsForDay(day); 
            
            return (
              <div key={day} className="bg-white h-32 p-2 hover:bg-slate-50 transition relative group border-b border-r border-slate-50">
                <span className={`text-sm font-medium ${events.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                    {events.map((evt, idx) => (
                        <div key={idx} className="bg-blue-50 text-blue-800 text-xs p-1 rounded border border-blue-100 cursor-pointer hover:bg-blue-100">
                            <strong>{evt.time}</strong> {evt.destination}
                            <div className="truncate text-[10px] text-blue-600">{evt.client}</div>
                        </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;