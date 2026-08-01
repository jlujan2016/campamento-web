import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/events';
import type { ScheduleSlot } from '../types';
import { ArrowLeft, RefreshCw, CheckCircle, List, CalendarDays } from 'lucide-react';
import SlotPicker from '../components/SlotPicker';
import CalendarTimeline from '../components/CalendarTimeline';

export default function MyScheduleePage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'} | null>(null);
  const [vista, setVista] = useState<'lista' | 'timeline'>('lista');

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSlots = async () => {
    if (!eventId) return;
    try {
      const data = await eventsApi.slots(eventId);
      setSlots(data);
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, [eventId]);

  const toggleSlot = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!eventId || selected.length === 0) return;
    setSubmitting(true);
    try {
      await eventsApi.signupSlots(eventId, selected);
      showToast(`Te anotaste en ${selected.length} turno(s) ✓`);
      setSelected([]);
      loadSlots(); // recargamos para actualizar los cupos disponibles
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
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
        <p className="text-blue-100 text-sm">Elegí tus turnos disponibles</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Selector de vista */}
        <div className="flex gap-2">
          <button
            onClick={() => setVista('lista')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center
                        justify-center gap-1
              ${vista === 'lista'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setVista('timeline')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center
                        justify-center gap-1
              ${vista === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendario
          </button>
        </div>

        {vista === 'lista' ? (
          <div className="card">
            <SlotPicker
              slots={slots}
              selected={selected}
              onToggle={toggleSlot}
              eventId={eventId}
            />
          </div>
        ) : (
          <CalendarTimeline
            slots={slots}
            eventId={eventId!}
            mode="participant"
            selected={selected}
            onToggle={toggleSlot}
          />
        )}
      </div>

      {/* Botón fijo abajo — aparece solo si hay algo seleccionado */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t
                        border-gray-100 p-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting
              ? 'Confirmando...'
              : `Confirmar ${selected.length} turno(s)`
            }
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 px-4 py-3 rounded-xl
                         text-sm font-medium shadow-lg z-50 text-center
                         ${toast.type === 'ok'
                           ? 'bg-green-500 text-white'
                           : 'bg-red-500 text-white'
                         }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}