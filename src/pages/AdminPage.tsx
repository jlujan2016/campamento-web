import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { eventsApi } from '../api/events';
import type { Event, EventMember, RankingEntry } from '../types';
import BottomNav from '../components/BottomNav';
import { Users, Trophy, RefreshCw, Moon, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'ranking'>('ranking');
  const [loading, setLoading] = useState(true);

  const loadEvent = async (event: Event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      const [membersData, rankingData] = await Promise.all([
        eventsApi.members(event.id),
        eventsApi.ranking(event.id),
      ]);
      setMembers(membersData);
      setRanking(rankingData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    eventsApi.list().then(data => {
      setEvents(data);
      if (data.length > 0) loadEvent(data[0]);
      else setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white px-4 pt-12 pb-6">
        <p className="font-semibold">Panel admin</p>
        <p className="text-blue-100 text-sm">{selectedEvent?.name || 'Cargando...'}</p>
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
                if (ev) loadEvent(ev);
              }}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${activeTab === 'ranking'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Ranking
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${activeTab === 'members'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Miembros
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Ranking */}
            {activeTab === 'ranking' && (
              <div className="space-y-2">
                {ranking.map((entry, i) => (
                  <div key={entry.user_id} className={`card flex items-center gap-3
                    ${!entry.meets_minimum ? 'opacity-60' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                    font-bold text-sm flex-shrink-0
                      ${entry.position === 1 ? 'bg-yellow-400 text-white' :
                        entry.position === 2 ? 'bg-gray-300 text-white' :
                        entry.position === 3 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 text-gray-500'}`}>
                      {entry.position || '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.user_name}</p>
                      <p className="text-xs text-gray-400">
                        {entry.hours_total.toFixed(1)}h total
                        · {entry.hours_real.toFixed(1)}h reales
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {entry.night_shift_completed && (
                        <Moon className="w-4 h-4 text-indigo-400" title="Turno noche cumplido" />
                      )}
                      {entry.meets_minimum
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                      }
                    </div>
                  </div>
                ))}
                {ranking.length === 0 && (
                  <div className="card text-center py-8">
                    <p className="text-gray-400 text-sm">Sin datos de ranking aún</p>
                  </div>
                )}
              </div>
            )}

            {/* Miembros */}
            {activeTab === 'members' && (
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="card flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center
                                    justify-center font-semibold text-blue-700 text-sm">
                      {member.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.user_name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {member.user_email || 'Sin email'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full
                      ${member.role === 'admin'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                      {member.role === 'admin' ? 'Admin' : 'Participante'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}