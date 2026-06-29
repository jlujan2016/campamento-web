import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function CreateEventPage() {
  const navigate = useNavigate();

  // Formulario controlado — cada campo tiene su propio estado
  const [name, setName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minShiftHours, setMinShiftHours] = useState('2');
  const [maxShiftHours, setMaxShiftHours] = useState('');
  const [minTotalHours, setMinTotalHours] = useState('');
  const [lateTolerance, setLateTolerance] = useState('15');
  const [nightStart, setNightStart] = useState('00:00');
  const [nightEnd, setNightEnd] = useState('06:00');
  const [requiresNight, setRequiresNight] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener GPS del dispositivo para autocompletar lat/lng
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('GPS no disponible en este dispositivo');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setError('No se pudo obtener la ubicación')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación básica antes de enviar
    if (!name || !venueName || !lat || !lng || !startDate || !endDate) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }

    setLoading(true);
    try {
      const event = await adminApi.createEvent({
        name,
        venue_name: venueName,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        // Convertimos las fechas locales a ISO 8601 con timezone
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        min_shift_hours: parseFloat(minShiftHours) || 2,
        max_shift_hours: maxShiftHours ? parseFloat(maxShiftHours) : undefined,
        min_total_hours: minTotalHours ? parseFloat(minTotalHours) : undefined,
        late_tolerance_minutes: parseFloat(lateTolerance) || 0,
        night_start_time: nightStart || undefined,
        night_end_time: nightEnd || undefined,
        requires_night_shift: requiresNight,
      });

      // Redirigimos al detalle del evento recién creado
      navigate(`/events/${event.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-xl font-bold">Nuevo campamento</h1>
        <p className="text-blue-100 text-sm">Configurá el evento</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Datos básicos */}
        <div className="card space-y-3">
          <h2 className="font-semibold">Datos del evento</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre del evento *
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: The Strokes - Lima 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre del lugar *
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Estadio Nacional"
              value={venueName}
              onChange={e => setVenueName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Ubicación GPS *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                className="input"
                placeholder="Latitud"
                value={lat}
                onChange={e => setLat(e.target.value)}
                required
              />
              <input
                type="number"
                step="any"
                className="input"
                placeholder="Longitud"
                value={lng}
                onChange={e => setLng(e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              onClick={getLocation}
              className="mt-2 flex items-center gap-2 text-sm text-blue-600"
            >
              <MapPin className="w-4 h-4" />
              Usar mi ubicación actual
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Inicio del campamento *
              </label>
              <input
                type="datetime-local"
                className="input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Fin del campamento *
              </label>
              <input
                type="datetime-local"
                className="input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Reglas de turnos */}
        <div className="card space-y-3">
          <h2 className="font-semibold">Reglas de turnos</h2>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Mín. horas por turno *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="input"
                value={minShiftHours}
                onChange={e => setMinShiftHours(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Máx. horas por turno
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
        </div>

        {/* Turno nocturno */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Turno nocturno</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={requiresNight}
                onChange={e => setRequiresNight(e.target.checked)}
                className="rounded"
              />
              Obligatorio
            </label>
          </div>
          <p className="text-xs text-gray-400">
            Define el rango horario considerado "turno nocturno".
            Si está marcado como obligatorio, el sistema lo mostrará
            como pendiente hasta que la persona cumpla al menos uno.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Inicio noche
              </label>
              <input
                type="time"
                className="input"
                value={nightStart}
                onChange={e => setNightStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Fin noche
              </label>
              <input
                type="time"
                className="input"
                value={nightEnd}
                onChange={e => setNightEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Creando evento...' : '✓ Crear campamento'}
        </button>

      </form>
    </div>
  );
}