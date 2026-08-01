import { useState, useEffect } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Moon, Plus, Users, RefreshCw } from 'lucide-react';
import type { ScheduleSlot } from '../types';
import { eventsApi } from '../api/events';

const PX_POR_HORA = 60;
const MIN_POR_PX = 60 / PX_POR_HORA;

interface Signup {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
}

interface Props {
  slots: ScheduleSlot[];
  eventId: string;
  // 'admin' permite crear turnos tocando espacios vacíos
  mode: 'admin' | 'participant';
  // Solo en modo participante: selección para anotarse
  selected?: string[];
  onToggle?: (slotId: string) => void;
  // Solo en modo admin: crear turno en una hora específica
  onCreateSlot?: (startISO: string) => void;
}

export default function CalendarTimeline({
  slots, eventId, mode, selected = [], onToggle, onCreateSlot
}: Props) {
  const [signups, setSignups] = useState<Record<string, Signup[]>>({});
  const [loadingNames, setLoadingNames] = useState(true);

  // Cargamos los inscriptos de todos los slots en paralelo
  useEffect(() => {
    if (slots.length === 0) {
      setLoadingNames(false);
      return;
    }
    let cancelled = false;

    Promise.all(
      slots.map(s =>
        eventsApi.slotSignups(eventId, s.id)
          .then(data => ({ slotId: s.id, data }))
          .catch(() => ({ slotId: s.id, data: [] as Signup[] }))
      )
    ).then(results => {
      if (cancelled) return;
      const map: Record<string, Signup[]> = {};
      results.forEach(r => {
        map[r.slotId] = (r.data as Signup[])
          .filter(s => s.status === 'confirmed');
      });
      setSignups(map);
      setLoadingNames(false);
    });

    return () => { cancelled = true; };
  }, [slots, eventId]);

  // Agrupamos por día (usando la fecha de inicio del slot)
  const slotsByDay = slots.reduce((acc, slot) => {
    const day = format(parseISO(slot.start_time), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  if (slots.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-gray-400 text-sm">No hay turnos creados aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadingNames && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Cargando inscriptos...
        </div>
      )}

      {Object.entries(slotsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, daySlots]) => {

        // El día arranca a las 00:00 de esa fecha
        const dayStart = new Date(day + 'T00:00:00');

        // Calculamos el rango visible: desde 1h antes del primer turno
        // hasta 1h después del último (opción B — compacto pero con margen)
        const startsMin = daySlots.map(s =>
          differenceInMinutes(parseISO(s.start_time), dayStart)
        );
        const endsMin = daySlots.map(s =>
          differenceInMinutes(parseISO(s.end_time), dayStart)
        );

        // Redondeamos hacia abajo/arriba a la hora completa, con 1h de margen
        const rangeStart = Math.max(0,
          Math.floor(Math.min(...startsMin) / 60) * 60 - 60
        );
        const rangeEnd = Math.ceil(Math.max(...endsMin) / 60) * 60 + 60;
        const totalMin = rangeEnd - rangeStart;
        const alturaTotal = (totalMin / MIN_POR_PX);

        // Líneas de hora para el fondo
        const horas: number[] = [];
        for (let m = rangeStart; m <= rangeEnd; m += 60) horas.push(m);

        // Espacios vacíos donde el admin puede crear turnos
        const huecos: { top: number; height: number; startMin: number }[] = [];
        if (mode === 'admin') {
          const ordenados = [...daySlots].sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
          );
          let cursor = rangeStart;
          ordenados.forEach(s => {
            const sStart = differenceInMinutes(parseISO(s.start_time), dayStart);
            const sEnd = differenceInMinutes(parseISO(s.end_time), dayStart);
            if (sStart - cursor >= 60) {
              huecos.push({
                top: (cursor - rangeStart) / MIN_POR_PX,
                height: (sStart - cursor) / MIN_POR_PX,
                startMin: cursor,
              });
            }
            cursor = Math.max(cursor, sEnd);
          });
          if (rangeEnd - cursor >= 60) {
            huecos.push({
              top: (cursor - rangeStart) / MIN_POR_PX,
              height: (rangeEnd - cursor) / MIN_POR_PX,
              startMin: cursor,
            });
          }
        }

        return (
          <div key={day} className="bg-white rounded-2xl border border-gray-100
                                    overflow-hidden">
            {/* Encabezado del día */}
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-100
                            flex items-center justify-between sticky top-0 z-10">
              <p className="text-sm font-semibold text-gray-700">
                {format(dayStart, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <span className="text-xs text-gray-400">
                {daySlots.length} turno{daySlots.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Grilla del día */}
            <div className="relative" style={{ height: alturaTotal + 8 }}>

              {/* Columna de horas */}
              <div className="absolute left-0 top-0 w-12 h-full">
                {horas.map(m => (
                  <div key={m}
                    className="absolute right-2 text-[10px] text-gray-400"
                    style={{ top: (m - rangeStart) / MIN_POR_PX - 5 }}>
                    {String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Líneas horizontales de fondo */}
              <div className="absolute left-12 right-0 top-0 h-full">
                {horas.map(m => (
                  <div key={m}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: (m - rangeStart) / MIN_POR_PX }} />
                ))}
              </div>

              {/* Espacios vacíos — crear turno (solo admin) */}
              {huecos.map((h, i) => (
                <button
                  key={`hueco-${i}`}
                  onClick={() => {
                    const fecha = new Date(dayStart);
                    fecha.setMinutes(fecha.getMinutes() + h.startMin);
                    //onCreateSlot?.(fecha.toISOString());
                    
                    // Formato local "YYYY-MM-DDTHH:mm" — sin conversión a UTC
                    const local = format(fecha, "yyyy-MM-dd'T'HH:mm");
                    onCreateSlot?.(local);
                  }}
                  className="absolute left-14 right-2 border border-dashed
                             border-gray-200 rounded-xl flex items-center
                             justify-center gap-1 text-xs text-gray-300
                             active:bg-gray-50"
                  style={{ top: h.top + 2, height: Math.max(h.height - 4, 28) }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear turno
                </button>
              ))}

              {/* Bloques de turnos */}
              {daySlots.map(slot => {
                const start = parseISO(slot.start_time);
                const end = parseISO(slot.end_time);
                const sMin = differenceInMinutes(start, dayStart);
                const eMin = differenceInMinutes(end, dayStart);
                const top = (sMin - rangeStart) / MIN_POR_PX;
                const height = Math.max((eMin - sMin) / MIN_POR_PX, 34);

                const isFull = slot.available_spots === 0;
                const isNight = start.getHours() >= 0 && start.getHours() < 6;
                const isSelected = selected.includes(slot.id);
                const nombres = signups[slot.id] || [];

                // Colores por estado
                const estilo = isSelected
                  ? 'bg-blue-100 border-blue-500'
                  : isFull
                  ? 'bg-red-50 border-red-400'
                  : isNight
                  ? 'bg-indigo-50 border-indigo-400'
                  : 'bg-green-50 border-green-500';

                const textoPrincipal = isSelected
                  ? 'text-blue-800'
                  : isFull
                  ? 'text-red-800'
                  : isNight
                  ? 'text-indigo-800'
                  : 'text-green-800';

                const textoSecundario = isSelected
                  ? 'text-blue-600'
                  : isFull
                  ? 'text-red-600'
                  : isNight
                  ? 'text-indigo-600'
                  : 'text-green-700';

                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (mode === 'participant' && !isFull) onToggle?.(slot.id);
                    }}
                    disabled={mode === 'participant' && isFull}
                    className={`absolute left-14 right-2 border-l-4 rounded-r-lg
                                text-left px-2 py-1.5 overflow-hidden ${estilo}`}
                    style={{ top: top + 2, height: height - 4 }}
                  >
                    <p className={`text-xs font-semibold ${textoPrincipal}
                                   flex items-center gap-1`}>
                      {isNight && <Moon className="w-3 h-3" />}
                      {format(start, 'HH:mm')} — {format(end, 'HH:mm')}
                      {isFull && ' · lleno'}
                    </p>
                    <p className={`text-[11px] ${textoSecundario} flex items-center gap-1`}>
                      <Users className="w-3 h-3" />
                      {slot.signups_count}/{slot.capacity}
                      {!isFull && ` · ${slot.available_spots} libre${slot.available_spots !== 1 ? 's' : ''}`}
                    </p>
                    {/* Nombres — solo si el bloque tiene altura suficiente */}
                    {height > 60 && nombres.length > 0 && (
                      <p className={`text-[11px] ${textoSecundario} mt-0.5 leading-tight`}>
                        {nombres.map(n => n.user_name).join(', ')}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}