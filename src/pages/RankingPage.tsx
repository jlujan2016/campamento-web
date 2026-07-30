import { useState, useEffect } from 'react';
import { eventsApi } from '../api/events';
import { useAuth } from '../hooks/useAuth';
import type { Event, RankingEntry } from '../types';
import BottomNav from '../components/BottomNav';
import { Trophy, RefreshCw, Moon, CheckCircle, XCircle } from 'lucide-react';

export default function RankingPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRanking = async (event: Event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      const data = await eventsApi.ranking(event.id);
      setRanking(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    eventsApi.list().then(data => {
      setEvents(data);
      if (data.length > 0) loadRanking(data[0]);
      else setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5" />
          <p className="font-semibold">Ranking oficial</p>
        </div>
        <p className="text-blue-100 text-sm">
          {selectedEvent?.name || 'Cargando...'}
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Selector de evento */}
        {events.length > 1 && (
          <div className="card">
            <select
              className="input"
              value={selectedEvent?.id || ''}
              onChange={e => {
                const ev = events.find(ev => ev.id === e.target.value);
                if (ev) loadRanking(ev);
              }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Leyenda de íconos — mejora detectada en el testing */}
        <div className="card py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Turno noche cumplido
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              Mínimo cumplido
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              Sin mínimo aún
            </span>
          </div>
          {selectedEvent?.min_total_hours && (
            <p className="text-xs text-gray-400 mt-2">
              Mínimo exigido: {selectedEvent.min_total_hours}h reales.
              Quienes no lo cumplen aparecen sin posición (—).
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map(entry => {
              const isMe = entry.user_id === user?.id;
              return (
                <div key={entry.user_id}
                  className={`card flex items-center gap-3
                    ${!entry.meets_minimum ? 'opacity-60' : ''}
                    ${isMe ? 'border-blue-300 border-2' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center
                                  justify-center font-bold text-sm flex-shrink-0
                    ${entry.position === 1 ? 'bg-yellow-400 text-white' :
                      entry.position === 2 ? 'bg-gray-300 text-white' :
                      entry.position === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-500'}`}>
                    {entry.position || '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {entry.user_name}
                      {isMe && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-600
                                         px-2 py-0.5 rounded-full">tú</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.hours_total.toFixed(1)}h total
                      · {entry.hours_real.toFixed(1)}h reales
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {entry.night_shift_completed && (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                    {entry.meets_minimum
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                </div>
              );
            })}
            {ranking.length === 0 && (
              <div className="card text-center py-10">
                <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Sin datos de ranking aún</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}