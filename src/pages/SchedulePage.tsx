import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/events';
import { adminApi } from '../api/admin';
import type { Event, ScheduleSlot } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Plus, Link as LinkIcon,
  Clock, Users, RefreshCw, Moon, Copy, Check, Calendar
} from 'lucide-react';
import CreateSlotModal from '../components/CreateSlotModal';

export default function SchedulePage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [eventData, slotsData] = await Promise.all([
        eventsApi.get(eventId),
        eventsApi.slots(eventId),
      ]);
      setEvent(eventData);
      setSlots(slotsData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [eventId]);

  const generateLink = async () => {
    if (!eventId) return;
    setGeneratingLink(true);
    try {
      const res: any = await adminApi.generateScheduleLink(eventId, 72);
      // Construimos el link completo para compartir
      const base = window.location.origin;
      const link = `${base}/s/${res.token}`;
      setGeneratedLink(link);
    } catch (err: any) {
      console.error(err);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Agrupamos los slots por día para que sea más fácil de leer
  const slotsByDay = slots.reduce((acc, slot) => {
    const day = format(parseISO(slot.start_time), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  const isNightShift = (slot: ScheduleSlot) => {
    const hour = parseISO(slot.start_time).getHours();
    return hour >= 0 && hour < 6;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <h1 className="text-xl font-bold">Cronograma</h1>
        <p className="text-blue-100 text-sm">{event?.name}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Acciones rápidas */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 flex items-center justify-center gap-2
                       bg-blue-600 text-white py-3 rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nuevo turno
          </button>
          <button
            onClick={generateLink}
            disabled={generatingLink}
            className="flex-1 flex items-center justify-center gap-2
                       bg-white border border-gray-200 text-gray-700
                       py-3 rounded-xl font-semibold"
          >
            <LinkIcon className="w-4 h-4" />
            {generatingLink ? 'Generando...' : 'Generar enlace'}
          </button>
        </div>

        {/* Link generado — aparece después de generarlo */}
        {generatedLink && (
          <div className="card space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              🔗 Enlace para compartir
            </p>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
              <p className="text-xs text-gray-500 flex-1 truncate">
                {generatedLink}
              </p>
              <button
                onClick={copyLink}
                className="flex-shrink-0 p-2 bg-blue-50 rounded-lg"
              >
                {copied
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <Copy className="w-4 h-4 text-blue-500" />
                }
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Válido por 72 horas. Compartilo por Telegram o WhatsApp
              para que la gente se anote sin necesidad de cuenta.
            </p>
          </div>
        )}

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-blue-600">{slots.length}</p>
            <p className="text-xs text-gray-400">Turnos totales</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-green-600">
              {slots.reduce((acc, s) => acc + s.signups_count, 0)}
            </p>
            <p className="text-xs text-gray-400">Inscriptos</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-amber-500">
              {slots.reduce((acc, s) => acc + s.available_spots, 0)}
            </p>
            <p className="text-xs text-gray-400">Cupos libres</p>
          </div>
        </div>

        {/* Cronograma agrupado por día */}
        {Object.keys(slotsByDay).length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No hay turnos creados aún.
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Tocá "Nuevo turno" para agregar el primero.
            </p>
          </div>
        ) : (
          Object.entries(slotsByDay).map(([day, daySlots]) => (
            <div key={day} className="space-y-2">
              {/* Encabezado del día */}
              <p className="text-sm font-semibold text-gray-500 px-1">
                {format(new Date(day + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>

              {daySlots.map(slot => {
                const start = parseISO(slot.start_time);
                const end = parseISO(slot.end_time);
                const isFull = slot.available_spots === 0;
                const isNight = isNightShift(slot);
                const fillPercent = Math.round(
                  (slot.signups_count / slot.capacity) * 100
                );

                return (
                  <div key={slot.id} className={`card space-y-2
                    ${isFull ? 'border-red-100' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {format(start, 'HH:mm')} — {format(end, 'HH:mm')}
                          </p>
                          {isNight && (
                            <span className="flex items-center gap-1 text-xs
                                             bg-indigo-50 text-indigo-600
                                             px-2 py-0.5 rounded-full">
                              <Moon className="w-3 h-3" /> Noche
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {((end.getTime() - start.getTime()) / 3600000).toFixed(1)}h
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold
                          ${isFull ? 'text-red-500' : 'text-green-600'}`}>
                          {isFull ? 'Lleno' : `${slot.available_spots} libre${slot.available_spots !== 1 ? 's' : ''}`}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                          <Users className="w-3 h-3" />
                          {slot.signups_count}/{slot.capacity}
                        </p>
                      </div>
                    </div>

                    {/* Barra de ocupación */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all
                          ${fillPercent >= 100 ? 'bg-red-400' :
                            fillPercent >= 60 ? 'bg-amber-400' : 'bg-green-400'
                          }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Modal para crear slot */}
      {showModal && event && (
        <CreateSlotModal
          eventId={eventId!}
          minShiftHours={event.min_shift_hours}
          maxShiftHours={event.max_shift_hours}
          onCreated={() => {
            loadData(); // recarga la lista de slots
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}