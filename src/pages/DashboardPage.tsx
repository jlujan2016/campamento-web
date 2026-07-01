import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { eventsApi } from '../api/events';
import { shiftsApi } from '../api/shifts';
import type { Event, Shift, PersonMetrics } from '../types';
import ShiftCard from '../components/ShiftCard';
import MetricsCard from '../components/MetricsCard';
import BottomNav from '../components/BottomNav';
import { LogOut, Tent, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Calendar, Package, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [metrics, setMetrics] = useState<PersonMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadEventData = async (event: Event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      const [shiftsData, metricsData] = await Promise.all([
        shiftsApi.myShifts(event.id),
        eventsApi.metrics(event.id),
      ]);
      setShifts(shiftsData);
      // Filtramos las métricas del usuario actual
      const myMetrics = metricsData.find(m => m.user_id === user?.id);
      setMetrics(myMetrics || null);
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    eventsApi.list()
      .then(data => {
        setEvents(data);
        if (data.length > 0) loadEventData(data[0]);
        else setLoading(false);
      })
      .catch(err => {
        showToast(err.message, 'err');
        setLoading(false);
      });
  }, []);

  const upcomingShifts = shifts.filter(s =>
    ['approved', 'active', 'pending'].includes(s.status)
  );
  const pastShifts = shifts.filter(s =>
    ['done', 'missed', 'cancelled'].includes(s.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Tent className="w-5 h-5" />
          <span className="font-semibold">Callate y baila! 🎵</span>
          </div>
          <button onClick={logout} className="p-2 rounded-xl active:bg-blue-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <p className="text-blue-100 text-sm">Hola, {user?.name} 👋</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Selector de evento */}
        {events.length > 1 && (
          <div className="card">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Evento activo
            </label>
            <select
              className="input"
              value={selectedEvent?.id || ''}
              onChange={e => {
                const ev = events.find(ev => ev.id === e.target.value);
                if (ev) loadEventData(ev);
              }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Métricas */}
            {metrics && (
              <MetricsCard
                metrics={metrics}
                minHours={selectedEvent?.min_total_hours}
              />
            )}

            {selectedEvent && (
              <Link
                to={`/events/${selectedEvent.id}/my-schedule`}
                className="card flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center
                                justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    Ver cronograma y anotarme
                  </p>
                  <p className="text-xs text-gray-400">
                    Elegí tus próximos turnos
                  </p>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            )}

            {selectedEvent && (
              <Link
                to={`/events/${selectedEvent.id}/contribute`}
                className="card flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center
                                justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    Registrar un aporte
                  </p>
                  <p className="text-xs text-gray-400">
                    Carpa, colchón, comida, pasaje...
                  </p>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            )}

            {selectedEvent && (
              <Link
                to={`/events/${selectedEvent.id}/extra-shift`}
                className="card flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center
                                justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    Solicitar turno extra
                  </p>
                  <p className="text-xs text-gray-400">
                    Vas aunque no estés en el cronograma
                  </p>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            )}

            {/* Turnos próximos */}
            {upcomingShifts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 px-1">
                  Tus próximos turnos
                </h3>
                {upcomingShifts.map(shift => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    onCheckinSuccess={msg => {
                      showToast(msg, 'ok');
                      if (selectedEvent) loadEventData(selectedEvent);
                    }}
                    onCheckinError={msg => showToast(msg, 'err')}
                  />
                ))}
              </div>
            )}

            {/* Historial */}
            {pastShifts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-500 px-1 text-sm">
                  Historial
                </h3>
                {pastShifts.map(shift => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    onCheckinSuccess={msg => showToast(msg, 'ok')}
                    onCheckinError={msg => showToast(msg, 'err')}
                  />
                ))}
              </div>
            )}

            {shifts.length === 0 && (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">
                  No tenés turnos asignados aún.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 px-4 py-3 rounded-xl text-sm
                         font-medium shadow-lg z-50 text-center
                         ${toast.type === 'ok'
                           ? 'bg-green-500 text-white'
                           : 'bg-red-500 text-white'
                         }`}>
          {toast.msg}
        </div>
      )}

      <BottomNav />
    </div>
  );
}