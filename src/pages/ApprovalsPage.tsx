import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { eventsApi } from '../api/events';
import type { Event } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, CheckCircle, XCircle,
  Clock, Package, RefreshCw, Inbox
} from 'lucide-react';

interface ExtraShift {
  id: string;
  user_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  shift_type: string;
  adjustment_reason: string | null;
}

interface Contribution {
  id: string;
  user_name: string;
  type_label: string;
  description: string | null;
  hour_bonus: number;
  status: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [extraShifts, setExtraShifts] = useState<ExtraShift[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shifts' | 'contributions'>('shifts');
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'} | null>(null);

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [eventData, shiftsData, contribData] = await Promise.all([
        eventsApi.get(eventId),
        adminApi.listAllShifts(eventId),
        adminApi.listContributions(eventId),
      ]);
      setEvent(eventData);
      // Filtramos solo los turnos extra pendientes
      setExtraShifts(shiftsData.filter((s: ExtraShift) =>
        s.shift_type === 'extra' && s.status === 'pending'
      ));
      // Filtramos solo los aportes pendientes
      setContributions(contribData.filter((c: Contribution) =>
        c.status === 'pending'
      ));
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [eventId]);

  // Aprobar turno extra — estado optimista: removemos de la lista inmediatamente
  const handleShiftAction = async (shiftId: string, action: 'approve' | 'reject') => {
    setProcessing(shiftId);
    // Removemos inmediatamente de la UI (optimista)
    setExtraShifts(prev => prev.filter(s => s.id !== shiftId));
    try {
      if (action === 'approve') {
        await adminApi.approveExtraShift(shiftId);
        showToast('Turno aprobado ✓');
      } else {
        // Para rechazar usamos el endpoint de approve con action reject
        await adminApi.approveContribution(shiftId, 'reject');
        showToast('Turno rechazado');
      }
    } catch (err: any) {
      // Si falla, recargamos para mostrar el estado real
      showToast(err.message, 'err');
      loadData();
    } finally {
      setProcessing(null);
    }
  };

  // Aprobar/rechazar aporte
  const handleContribAction = async (
    contribId: string,
    action: 'approve' | 'reject'
  ) => {
    setProcessing(contribId);
    // Removemos inmediatamente (optimista)
    setContributions(prev => prev.filter(c => c.id !== contribId));
    try {
      await adminApi.approveContribution(contribId, action);
      showToast(action === 'approve' ? 'Aporte aprobado ✓' : 'Aporte rechazado');
    } catch (err: any) {
      showToast(err.message, 'err');
      loadData();
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = extraShifts.length + contributions.length;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Aprobaciones</h1>
            <p className="text-blue-100 text-sm">{event?.name}</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-red-400 text-white text-sm font-bold
                             px-3 py-1 rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium
                        transition-colors flex items-center justify-center gap-2
              ${activeTab === 'shifts'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            <Clock className="w-4 h-4" />
            Turnos extra
            {extraShifts.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${activeTab === 'shifts'
                  ? 'bg-white text-blue-600'
                  : 'bg-red-100 text-red-600'
                }`}>
                {extraShifts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium
                        transition-colors flex items-center justify-center gap-2
              ${activeTab === 'contributions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            <Package className="w-4 h-4" />
            Aportes
            {contributions.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${activeTab === 'contributions'
                  ? 'bg-white text-blue-600'
                  : 'bg-red-100 text-red-600'
                }`}>
                {contributions.length}
              </span>
            )}
          </button>
        </div>

        {/* Lista de turnos extra pendientes */}
        {activeTab === 'shifts' && (
          <div className="space-y-3">
            {extraShifts.length === 0 ? (
              <div className="card text-center py-10">
                <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No hay turnos extra pendientes
                </p>
              </div>
            ) : (
              extraShifts.map(shift => (
                <div key={shift.id} className="card space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {shift.user_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(shift.scheduled_start),
                          "d MMM, HH:mm", { locale: es })} —{' '}
                        {format(parseISO(shift.scheduled_end),
                          "HH:mm", { locale: es })}
                      </p>
                      {shift.adjustment_reason && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          "{shift.adjustment_reason}"
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-purple-50 text-purple-700
                                     px-2 py-1 rounded-full">
                      Extra
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShiftAction(shift.id, 'approve')}
                      disabled={processing === shift.id}
                      className="flex-1 flex items-center justify-center gap-2
                                 bg-green-50 text-green-700 py-2.5 rounded-xl
                                 text-sm font-semibold active:bg-green-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleShiftAction(shift.id, 'reject')}
                      disabled={processing === shift.id}
                      className="flex-1 flex items-center justify-center gap-2
                                 bg-red-50 text-red-600 py-2.5 rounded-xl
                                 text-sm font-semibold active:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Lista de aportes pendientes */}
        {activeTab === 'contributions' && (
          <div className="space-y-3">
            {contributions.length === 0 ? (
              <div className="card text-center py-10">
                <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No hay aportes pendientes
                </p>
              </div>
            ) : (
              contributions.map(contrib => (
                <div key={contrib.id} className="card space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {contrib.user_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {contrib.type_label} — +{contrib.hour_bonus}h
                      </p>
                      {contrib.description && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          "{contrib.description}"
                        </p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">
                        {format(parseISO(contrib.created_at),
                          "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-600
                                     bg-amber-50 px-2 py-1 rounded-xl">
                      +{contrib.hour_bonus}h
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContribAction(contrib.id, 'approve')}
                      disabled={processing === contrib.id}
                      className="flex-1 flex items-center justify-center gap-2
                                 bg-green-50 text-green-700 py-2.5 rounded-xl
                                 text-sm font-semibold active:bg-green-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleContribAction(contrib.id, 'reject')}
                      disabled={processing === contrib.id}
                      className="flex-1 flex items-center justify-center gap-2
                                 bg-red-50 text-red-600 py-2.5 rounded-xl
                                 text-sm font-semibold active:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

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