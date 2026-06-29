import { useState } from 'react';
import { MapPin, LogIn, LogOut, Loader } from 'lucide-react';
import { shiftsApi } from '../api/shifts';
import type { Shift } from '../types';

interface Props {
  shift: Shift;
  onSuccess: (message: string) => void;
  onError: (msg: string) => void;
}

export default function CheckinButton({ shift, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const getGPS = (): Promise<GeolocationPosition | null> => {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos),
        () => resolve(null),  // si falla el GPS, continuamos igual
        { timeout: 5000 }
      );
    });
  };

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const pos = await getGPS();
      const res = await shiftsApi.checkin(
        shift.id,
        pos?.coords.latitude,
        pos?.coords.longitude,
        pos?.coords.accuracy,
      );
      onSuccess(res.message);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const pos = await getGPS();
      const res = await shiftsApi.checkout(
        shift.id,
        pos?.coords.latitude,
        pos?.coords.longitude,
      );
      onSuccess(res.message);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isActive = shift.status === 'active';
  const isApproved = shift.status === 'approved';

  if (!isActive && !isApproved) return null;

  return (
    <div className="space-y-2">
      {isApproved && (
        <button
          onClick={handleCheckin}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading
            ? <Loader className="w-4 h-4 animate-spin" />
            : <LogIn className="w-4 h-4" />
          }
          {loading ? 'Registrando...' : 'Hacer check-in'}
        </button>
      )}
      {isActive && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-xl
                     font-semibold active:bg-green-700 transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading
            ? <Loader className="w-4 h-4 animate-spin" />
            : <LogOut className="w-4 h-4" />
          }
          {loading ? 'Registrando...' : 'Hacer check-out'}
        </button>
      )}
      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3" />
        GPS registrado automáticamente
      </p>
    </div>
  );
}