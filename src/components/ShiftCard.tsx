import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Shift } from '../types';
import CheckinButton from './CheckinButton';

interface Props {
  shift: Shift;
  onCheckinSuccess: (msg: string) => void;
  onCheckinError: (msg: string) => void;
}

const statusConfig = {
  approved: { label: 'Aprobado', color: 'bg-blue-50 text-blue-700', icon: Clock },
  active:   { label: 'En curso', color: 'bg-green-50 text-green-700', icon: CheckCircle },
  done:     { label: 'Completado', color: 'bg-gray-100 text-gray-500', icon: CheckCircle },
  pending:  { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-700', icon: AlertCircle },
  missed:   { label: 'Falta', color: 'bg-red-50 text-red-600', icon: XCircle },
  cancelled:{ label: 'Cancelado', color: 'bg-gray-100 text-gray-400', icon: XCircle },
  gap_unresolved: { label: 'Vacío', color: 'bg-orange-50 text-orange-600', icon: AlertCircle },
};

export default function ShiftCard({ shift, onCheckinSuccess, onCheckinError }: Props) {
  const start = parseISO(shift.scheduled_start);
  const end = parseISO(shift.scheduled_end);
  const config = statusConfig[shift.status as keyof typeof statusConfig]
    || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">
            {format(start, "d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-sm text-gray-500">
            {format(start, 'HH:mm')} — {format(end, 'HH:mm')}
          </p>
          {shift.shift_type === 'extra' && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
              Turno extra
            </span>
          )}
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      {shift.adjustment_reason && (
        <p className="text-xs text-gray-400 italic">{shift.adjustment_reason}</p>
      )}

      <CheckinButton
        shift={shift}
        onSuccess={onCheckinSuccess}
        onError={onCheckinError}
      />
    </div>
  );
}