import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Moon, CheckCircle, Users, ChevronDown, RefreshCw } from 'lucide-react';
import type { ScheduleSlot } from '../types';
import { eventsApi } from '../api/events';

interface Signup {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
}

interface Props {
  slots: ScheduleSlot[];
  selected: string[];
  onToggle: (slotId: string) => void;
  eventId?: string;   // necesario para consultar inscriptos; opcional
}

export default function SlotPicker({ slots, selected, onToggle, eventId }: Props) {
  // Qué slot tiene el acordeón abierto y sus inscriptos cargados
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [signups, setSignups] = useState<Record<string, Signup[]>>({});
  const [loadingSignups, setLoadingSignups] = useState<string | null>(null);

  const toggleSignups = async (slotId: string) => {
    // Si ya está abierto, lo cerramos
    if (expandedSlot === slotId) {
      setExpandedSlot(null);
      return;
    }
    setExpandedSlot(slotId);

    // Cargamos los inscriptos solo la primera vez (cache simple en estado)
    if (!signups[slotId] && eventId) {
      setLoadingSignups(slotId);
      try {
        const data = await eventsApi.slotSignups(eventId, slotId);
        setSignups(prev => ({
          ...prev,
          [slotId]: data.filter((s: Signup) => s.status === 'confirmed'),
        }));
      } catch {
        setSignups(prev => ({ ...prev, [slotId]: [] }));
      } finally {
        setLoadingSignups(null);
      }
    }
  };
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
            const isExpanded = expandedSlot === slot.id;
            const slotSignups = signups[slot.id];

            return (
              <div key={slot.id}
                className={`rounded-xl border-2 transition-all overflow-hidden
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isFull
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-100 bg-white'
                  }`}>

                {/* Área de selección — tocar acá elige el slot */}
                <button
                  onClick={() => !isFull && onToggle(slot.id)}
                  disabled={isFull}
                  className={`w-full text-left p-3 ${isFull ? 'opacity-50' : ''}`}
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

                {/* Botón "quiénes van" — solo si hay inscriptos y tenemos eventId */}
                {eventId && slot.signups_count > 0 && (
                  <button
                    onClick={() => toggleSignups(slot.id)}
                    className="w-full flex items-center justify-between px-3 py-2
                               border-t border-gray-100 text-xs text-gray-500
                               active:bg-gray-50"
                  >
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {slot.signups_count} anotado{slot.signups_count !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform
                      ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Acordeón con los nombres */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-50">
                    {loadingSignups === slot.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-300 mx-auto my-2" />
                    ) : slotSignups && slotSignups.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {slotSignups.map(s => (
                          <span key={s.id}
                            className="text-xs bg-gray-100 text-gray-600
                                       px-2 py-1 rounded-full">
                            {s.user_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 text-center py-1">
                        Sin inscriptos confirmados
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}