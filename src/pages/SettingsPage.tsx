import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/events';
import { adminApi } from '../api/admin';
import type { Event } from '../types';
import {
  ArrowLeft, Plus, Package, Settings as SettingsIcon,
  RefreshCw, Save
} from 'lucide-react';
import ContributionTypeModal from '../components/ContributionTypeModal';

interface ContributionType {
  id: string;
  label: string;
  type_key: string;
  default_hour_bonus: number;
}

export default function SettingsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [types, setTypes] = useState<ContributionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'} | null>(null);

  // Campos editables de las reglas del evento
  const [minShiftHours, setMinShiftHours] = useState('');
  const [maxShiftHours, setMaxShiftHours] = useState('');
  const [minTotalHours, setMinTotalHours] = useState('');
  const [lateTolerance, setLateTolerance] = useState('');
  const [requiresNight, setRequiresNight] = useState(false);

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [eventData, typesData] = await Promise.all([
        eventsApi.get(eventId),
        adminApi.listContributionTypes(eventId),
      ]);
      setEvent(eventData);
      setTypes(typesData);

      // Precargamos el formulario con los valores actuales del evento
      setMinShiftHours(String(eventData.min_shift_hours));
      setMaxShiftHours(eventData.max_shift_hours ? String(eventData.max_shift_hours) : '');
      setMinTotalHours(eventData.min_total_hours ? String(eventData.min_total_hours) : '');
      setLateTolerance(String(eventData.late_tolerance_minutes));
      setRequiresNight(eventData.requires_night_shift);
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [eventId]);

  const handleSaveRules = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await adminApi.updateEvent(eventId, {
        min_shift_hours: parseFloat(minShiftHours) || 1,
        max_shift_hours: maxShiftHours ? parseFloat(maxShiftHours) : undefined,
        min_total_hours: minTotalHours ? parseFloat(minTotalHours) : undefined,
        late_tolerance_minutes: parseFloat(lateTolerance) || 0,
        requires_night_shift: requiresNight,
      });
      showToast('Reglas actualizadas ✓');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-xl font-bold">Configuración</h1>
        <p className="text-blue-100 text-sm">{event?.name}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Reglas del evento */}
        <div className="card space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-gray-400" />
            Reglas del campamento
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Mín. horas/turno
              </label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={minShiftHours}
                onChange={e => setMinShiftHours(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Máx. horas/turno
              </label>
              <input
                type="number"
                step="0.5"
                className="input"
                placeholder="Sin límite"
                value={maxShiftHours}
                onChange={e => setMaxShiftHours(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Mín. horas totales
              </label>
              <input
                type="number"
                step="0.5"
                className="input"
                placeholder="Sin mínimo"
                value={minTotalHours}
                onChange={e => setMinTotalHours(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Tolerancia tardanza (min)
              </label>
              <input
                type="number"
                min="0"
                className="input"
                value={lateTolerance}
                onChange={e => setLateTolerance(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={requiresNight}
              onChange={e => setRequiresNight(e.target.checked)}
              className="rounded"
            />
            Exigir turno nocturno obligatorio
          </label>

          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar reglas'}
          </button>
        </div>

        {/* Tipos de aporte */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              Tipos de aporte
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-blue-600 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {types.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              No hay tipos de aporte configurados aún.
            </p>
          ) : (
            <div className="space-y-2">
              {types.map(type => (
                <div key={type.id}
                  className="flex items-center justify-between bg-gray-50
                             rounded-xl px-3 py-2.5">
                  <p className="font-medium text-sm text-gray-700">
                    {type.label}
                  </p>
                  <span className="text-sm font-bold text-amber-600">
                    {type.default_hour_bonus}h
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal */}
      {showModal && eventId && (
        <ContributionTypeModal
          eventId={eventId}
          onCreated={loadData}
          onClose={() => setShowModal(false)}
        />
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