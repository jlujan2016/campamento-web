import { useState } from 'react';
import { adminApi } from '../api/admin';
import { X } from 'lucide-react';

interface Props {
  eventId: string;
  onCreated: () => void;
  onClose: () => void;
}

export default function ContributionTypeModal({ eventId, onCreated, onClose }: Props) {
  const [label, setLabel] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [hourBonus, setHourBonus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generamos automáticamente el type_key a partir del label
  // (ej. "Carpa grande" -> "carpa_grande")
  const handleLabelChange = (value: string) => {
    setLabel(value);
    const key = value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setTypeKey(key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!label || !hourBonus) {
      setError('Completá nombre y horas');
      return;
    }

    setLoading(true);
    try {
      await adminApi.createContributionType(eventId, {
        type_key: typeKey,
        label,
        default_hour_bonus: parseFloat(hourBonus),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo tipo de aporte</h2>
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
              Nombre del aporte *
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Carpa, Colchón, Comida"
              value={label}
              onChange={e => handleLabelChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Horas que vale *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              className="input"
              placeholder="Ej: 5"
              value={hourBonus}
              onChange={e => setHourBonus(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Cada vez que alguien registre este aporte, el sistema
              va a sugerir este valor (el admin puede ajustarlo al aprobar)
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando...' : '+ Agregar tipo de aporte'}
          </button>
        </form>
      </div>
    </div>
  );
}