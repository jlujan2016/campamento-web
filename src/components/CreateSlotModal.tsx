import { useState } from 'react';
import { adminApi } from '../api/admin';
import { X, Clock } from 'lucide-react';

interface Props {
  eventId: string;
  minShiftHours: number;
  maxShiftHours?: number | null;
  onCreated: () => void;
  onClose: () => void;
}

export default function CreateSlotModal({
  eventId, minShiftHours, maxShiftHours, onCreated, onClose
}: Props) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cuando el usuario elige hora de inicio, calculamos automáticamente
  // la hora de fin según el mínimo configurado en el evento
  const handleStartChange = (value: string) => {
    setStartTime(value);
    if (value && minShiftHours) {
      const start = new Date(value);
      const end = new Date(start.getTime() + minShiftHours * 60 * 60 * 1000);
      // Formateamos al formato que espera datetime-local
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
      setEndTime(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startTime || !endTime) {
      setError('Completá los horarios');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (durationHours < minShiftHours) {
      setError(`El turno debe durar al menos ${minShiftHours}h`);
      return;
    }

    if (maxShiftHours && durationHours > maxShiftHours) {
      setError(`El turno no puede durar más de ${maxShiftHours}h`);
      return;
    }

    setLoading(true);
    try {
      await adminApi.createSlot(eventId, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        capacity: parseInt(capacity) || 1,
      });
      onCreated(); // avisa al padre que recargue la lista
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay oscuro detrás del modal
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      {/* El modal sube desde abajo — patrón "bottom sheet" típico en móvil */}
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo turno</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Inicio del turno *
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
              Fin del turno *
            </label>
            <input
              type="datetime-local"
              className="input"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Mínimo {minShiftHours}h
              {maxShiftHours ? ` — Máximo ${maxShiftHours}h` : ''}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Cupos disponibles
            </label>
            <input
              type="number"
              min="1"
              max="20"
              className="input"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Creando...' : '+ Agregar turno'}
          </button>
        </form>
      </div>
    </div>
  );
}