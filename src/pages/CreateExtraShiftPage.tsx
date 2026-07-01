import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/events';
import { shiftsApi } from '../api/shifts';
import type { Event } from '../types';
import { ArrowLeft, Clock, RefreshCw, CheckCircle } from 'lucide-react';

export default function CreateExtraShiftPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    eventsApi.get(eventId)
      .then(setEvent)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Auto-calcula el fin según el mínimo de horas del evento
  const handleStartChange = (value: string) => {
    setStartTime(value);
    if (value && event?.min_shift_hours) {
      const start = new Date(value);
      const end = new Date(
        start.getTime() + event.min_shift_hours * 60 * 60 * 1000
      );
      const pad = (n: number) => n.toString().padStart(2, '0');
      setEndTime(
        `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}` +
        `T${pad(end.getHours())}:${pad(end.getMinutes())}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setError('');

    if (!startTime || !endTime) {
      setError('Completá los horarios');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError('La hora de fin debe ser posterior al inicio');
      return;
    }

    if (event?.min_shift_hours) {
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hours < event.min_shift_hours) {
        setError(`El turno debe durar al menos ${event.min_shift_hours}h`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await shiftsApi.createExtra(
        eventId,
        start.toISOString(),
        end.toISOString(),
        notes || undefined
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  // Pantalla de éxito
  if (success) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center
                    justify-center px-6 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                      justify-center">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold">¡Turno registrado!</h2>
      <p className="text-gray-500 text-sm">
        Tu turno extra quedó pendiente de aprobación.
        El admin lo va a revisar y vas a recibir una notificación
        por Telegram cuando lo apruebe.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="btn-primary mt-4"
      >
        Volver al inicio
      </button>
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
        <h1 className="text-xl font-bold">Turno extra</h1>
        <p className="text-blue-100 text-sm">
          Avisá que vas a ir aunque no estés en el cronograma
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="card space-y-3">
          <h2 className="font-semibold">¿Cuándo vas a ir?</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Llegada *
            </label>
            <input
              type="datetime-local"
              className="input"
              value={startTime}
              onChange={e => handleStartChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Salida *
            </label>
            <input
              type="datetime-local"
              className="input"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
            {event?.min_shift_hours && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Mínimo {event.min_shift_hours}h por turno
              </p>
            )}
          </div>
        </div>

        <div className="card space-y-2">
          <h2 className="font-semibold">Motivo (opcional)</h2>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Ej: Tengo la tarde libre y quiero ayudar"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="card bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700">
            ℹ️ El turno extra queda pendiente hasta que el admin lo apruebe.
            Una vez aprobado, vas a poder hacer check-in/out normalmente
            y las horas van a sumar a tu puntaje.
          </p>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Enviando...' : 'Solicitar turno extra'}
        </button>
      </form>
    </div>
  );
}