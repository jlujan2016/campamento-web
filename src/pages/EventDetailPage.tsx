import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsApi } from '../api/events';
import type { Event } from '../types';
import { ArrowLeft, Calendar, CheckSquare, Users,
         Settings, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    eventsApi.get(id)
      .then(setEvent)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card text-center">
        <p className="text-red-500">{error || 'Evento no encontrado'}</p>
      </div>
    </div>
  );

  const menuItems = [
    {
      icon: Calendar,
      label: 'Cronograma',
      description: 'Crear slots y enlace temporal',
      to: `/events/${id}/schedule`,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: CheckSquare,
      label: 'Aprobaciones',
      description: 'Turnos extra y aportes pendientes',
      to: `/events/${id}/approvals`,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Users,
      label: 'Participantes',
      description: 'Ver miembros y ranking',
      to: `/events/${id}/members`,
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: Settings,
      label: 'Configuración',
      description: 'Tipos de aporte y reglas',
      to: `/events/${id}/settings`,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <h1 className="text-xl font-bold">{event.name}</h1>
        <p className="text-blue-100 text-sm">{event.venue_name}</p>
        <div className="flex gap-4 mt-3 text-sm text-blue-100">
          <span>
            📅 {format(parseISO(event.start_date), "d MMM", { locale: es })} —{' '}
            {format(parseISO(event.end_date), "d MMM yyyy", { locale: es })}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium
            ${event.status === 'active'
              ? 'bg-green-400 text-white'
              : 'bg-gray-300 text-gray-700'
            }`}>
            {event.status === 'active' ? 'Activo' : event.status}
          </span>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Resumen de reglas */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            Reglas del campamento
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Mín. horas/turno</p>
              <p className="font-semibold">{event.min_shift_hours}h</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Tolerancia tardanza</p>
              <p className="font-semibold">{event.late_tolerance_minutes} min</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Mín. horas totales</p>
              <p className="font-semibold">
                {event.min_total_hours ? `${event.min_total_hours}h` : 'Sin mínimo'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Turno nocturno</p>
              <p className="font-semibold">
                {event.night_start_time
                  ? `${event.night_start_time} — ${event.night_end_time}`
                  : 'No configurado'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Menu de acciones */}
        {menuItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="card flex items-center gap-4 active:bg-gray-50"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center
                             justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-400">{item.description}</p>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}