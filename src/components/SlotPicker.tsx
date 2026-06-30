import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Moon, CheckCircle } from 'lucide-react';
import type { ScheduleSlot } from '../types';

interface Props {
  slots: ScheduleSlot[];
  selected: string[];
  onToggle: (slotId: string) => void;
}

export default function SlotPicker({ slots, selected, onToggle }: Props) {
  // Agrupamos por día para que sea más fácil de escanear visualmente
  const slotsByDay = slots.reduce((acc, slot) => {
    const day = format(parseISO(slot.start_time), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  if (slots.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">
        No hay turnos disponibles en este momento.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(slotsByDay).map(([day, daySlots]) => (
        <div key={day} className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 px-1 uppercase">
            {format(new Date(day + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
          </p>

          {daySlots.map(slot => {
            const start = parseISO(slot.start_time);
            const end = parseISO(slot.end_time);
            const isSelected = selected.includes(slot.id);
            const isFull = slot.available_spots === 0;
            const isNight = start.getHours() >= 0 && start.getHours() < 6;

            return (
              <button
                key={slot.id}
                onClick={() => !isFull && onToggle(slot.id)}
                disabled={isFull}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isFull
                    ? 'border-gray-100 bg-gray-50 opacity-50'
                    : 'border-gray-100 bg-white active:border-blue-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium text-sm
                      ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                      {format(start, 'HH:mm')} — {format(end, 'HH:mm')}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      {slot.available_spots} de {slot.capacity} cupos
                      {isNight && (
                        <span className="flex items-center gap-0.5 text-indigo-500 ml-1">
                          <Moon className="w-3 h-3" /> Noche
                        </span>
                      )}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  {isFull && (
                    <span className="text-xs text-gray-400">Lleno</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}