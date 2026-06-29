import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi } from '../api/events';
import type { ScheduleSlot } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Moon, Clock, CheckCircle } from 'lucide-react';

export default function ScheduleLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    eventsApi.publicSchedule(token)
      .then(setData)
      .catch(() => setError('Enlace inválido o expirado'))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleSlot = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || selected.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/schedule/${token}/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, slot_ids: selected }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500
                        border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card text-center">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="font-semibold text-lg">¡Te anotaste!</h2>
          <p className="text-gray-500 text-sm">
            Quedaste inscripto en {selected.length} turno(s).
            El admin recibirá tu confirmación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="card text-center">
          <h1 className="font-bold text-lg">{data?.event_name}</h1>
          <p className="text-gray-500 text-sm">{data?.venue_name}</p>
          <p className="text-xs text-gray-400 mt-1">
            Enlace válido hasta{' '}
            {data?.expires_at
              ? format(parseISO(data.expires_at), "d MMM HH:mm", { locale: es })
              : '—'
            }
          </p>
        </div>

        {/* Datos del invitado */}
        <div className="card space-y-3">
          <h2 className="font-semibold">Tus datos</h2>
          <input
            type="text"
            className="input"
            placeholder="Nombre completo"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            className="input"
            placeholder="Número de teléfono"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>

        {/* Slots disponibles */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Elegí tus horarios</h2>
            {selected.length > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {selected.length} elegido(s)
              </span>
            )}
          </div>

          {data?.slots?.map((slot: ScheduleSlot) => {
            const start = parseISO(slot.start_time);
            const end = parseISO(slot.end_time);
            const isSelected = selected.includes(slot.id);
            const isFull = slot.available_spots === 0;
            const isNight = start.getHours() >= 0 && start.getHours() < 6;

            return (
              <button
                key={slot.id}
                onClick={() => !isFull && toggleSlot(slot.id)}
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
                      {format(start, "d MMM", { locale: es })} ·{' '}
                      {format(start, 'HH:mm')} — {format(end, 'HH:mm')}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {slot.available_spots} de {slot.capacity} cupos
                      {isNight && (
                        <span className="flex items-center gap-0.5 text-indigo-500 ml-1">
                          <Moon className="w-3 h-3" /> Turno noche
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

        {/* Botón de confirmar */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={submitting || selected.length === 0 || !name || !phone}
            className="btn-primary"
          >
            {submitting
              ? 'Confirmando...'
              : `Confirmar ${selected.length} turno(s)`
            }
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          No necesitás crear una cuenta para anotarte
        </p>
      </div>
    </div>
  );
}