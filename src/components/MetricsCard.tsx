import type { PersonMetrics } from '../types';
import { Moon, Clock, Package, Star } from 'lucide-react';

interface Props {
  metrics: PersonMetrics;
  minHours?: number | null;
}

export default function MetricsCard({ metrics, minHours }: Props) {
  const progress = minHours
    ? Math.min((metrics.hours_real / minHours) * 100, 100)
    : null;

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-gray-900">Mis horas</h3>

      {/* Barra de progreso hacia el mínimo */}
      {minHours && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progreso al mínimo ({minHours}h)</span>
            <span>{metrics.hours_real.toFixed(1)}h</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Las 4 métricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Horas debidas</p>
          <p className="text-xl font-semibold">{metrics.hours_scheduled.toFixed(1)}h</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-600 mb-1">Horas reales</p>
          <p className="text-xl font-semibold text-blue-700">
            {metrics.hours_real.toFixed(1)}h
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Package className="w-3 h-3" /> Aportes
          </p>
          <p className="text-xl font-semibold">+{metrics.contributions_bonus.toFixed(1)}h</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
            <Star className="w-3 h-3" /> Total oficial
          </p>
          <p className="text-xl font-semibold text-green-700">
            {metrics.hours_total.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex gap-2">
        <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full
          ${metrics.night_shift_completed
            ? 'bg-indigo-50 text-indigo-700'
            : 'bg-gray-100 text-gray-400'
          }`}>
          <Moon className="w-3 h-3" />
          Turno noche {metrics.night_shift_completed ? '✓' : 'pendiente'}
        </span>
        <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full
          ${metrics.meets_minimum
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-600'
          }`}>
          <Clock className="w-3 h-3" />
          {metrics.meets_minimum ? 'Mínimo cumplido' : 'Sin mínimo aún'}
        </span>
      </div>
    </div>
  );
}