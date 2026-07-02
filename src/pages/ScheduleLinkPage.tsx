import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/events';
import type { ScheduleSlot } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import SlotPicker from '../components/SlotPicker';
import { useAuth } from '../hooks/useAuth';

export default function ScheduleLinkPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, setTokenAndReload } = useAuth();

  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // Datos del usuario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [wantsAccount, setWantsAccount] = useState(true); // por defecto crea cuenta

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signupsCount, setSignupsCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    // Si ya está logueado, precargamos sus datos
    if (user) {
      setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      setWantsAccount(false); // ya tiene cuenta
    }

    eventsApi.publicSchedule(token)
      .then(setData)
      .catch(() => setError('Enlace inválido o expirado'))
      .finally(() => setLoading(false));
  }, [token, user]);

  const toggleSlot = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || selected.length === 0) return;
    // Si ya está logueado, usamos sus datos del contexto directamente
    const effectiveName = user ? user.name : name;
    const effectivePhone = user ? (user.phone || '') : phone;

    // Validaciones
    if (!name.trim() || !phone.trim()) {
      setError('Nombre y teléfono son requeridos');
      return;
    }

    if (wantsAccount && !user) {
      if (!email.trim()) {
        setError('El email es requerido para crear cuenta');
        return;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const body: any = {
        name,
        phone: effectivePhone || 'sin-telefono',  // fallback si no tiene teléfono
        slot_ids: selected,
      };

      // Solo mandamos email/password si quiere crear cuenta y no está logueado
      if (wantsAccount && !user) {
        body.email = email;
        body.password = password;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/schedule/${token}/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const result = await res.json();
      setSignupsCount(result.signups.length);

      // Si se creó cuenta nueva con JWT, la guardamos y redirigimos al dashboard
      if (result.token) {
        // Actualizamos el contexto de auth con el nuevo token
        // y esperamos a que cargue el usuario antes de redirigir
        await setTokenAndReload(result.token);
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setSuccess(true);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500
                      border-t-transparent rounded-full" />
    </div>
  );

  if (error && !data) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card text-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center
                    px-6 text-center space-y-4 bg-gray-50">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                      justify-center">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold">
        {wantsAccount && !user ? '¡Cuenta creada!' : '¡Te anotaste!'}
      </h2>
      <p className="text-gray-500 text-sm">
        Quedaste inscripto en <strong>{signupsCount} turno(s)</strong>.
      </p>
      {wantsAccount && !user ? (
        <p className="text-gray-400 text-sm">
          Entrando a la app en unos segundos...
        </p>
      ) : (
        <button
          onClick={() => navigate('/')}
          className="btn-primary mt-2"
        >
          Ir al dashboard
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header del evento */}
        <div className="card text-center">
          <h1 className="font-bold text-lg">{data?.event_name}</h1>
          <p className="text-gray-500 text-sm">{data?.venue_name}</p>
          <p className="text-xs text-gray-400 mt-1">
            Válido hasta{' '}
            {data?.expires_at
              ? format(parseISO(data.expires_at), "d MMM HH:mm", { locale: es })
              : '—'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Datos del usuario — solo si no está logueado */}
          {!user && (
            <div className="card space-y-3">
              <h2 className="font-semibold">Tus datos</h2>

              <input
                type="text"
                className="input"
                placeholder="Nombre completo *"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input
                type="tel"
                className="input"
                placeholder="Número de teléfono *"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />

              {/* Toggle: crear cuenta o solo anotarse */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Crear cuenta para acceder a la app
                  </p>
                  <p className="text-xs text-gray-400">
                    Podrás hacer check-in, ver tus métricas y más
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWantsAccount(!wantsAccount)}
                  className={`w-12 h-6 rounded-full transition-colors relative
                    ${wantsAccount ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full
                                    shadow transition-transform
                    ${wantsAccount ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Campos de cuenta — solo si quiere crear cuenta */}
              {wantsAccount && (
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <input
                    type="email"
                    className="input"
                    placeholder="Email *"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Contraseña (mín. 8 caracteres) *"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Si ya está logueado, mostramos quién es */}
          {user && (
            <div className="card flex items-center gap-3 bg-blue-50
                            border border-blue-100">
              <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center
                              justify-center font-semibold text-blue-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">
                  Anotándote con tu cuenta existente
                </p>
              </div>
            </div>
          )}

          {/* Selector de slots */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Elegí tus horarios</h2>
              {selected.length > 0 && (
                <span className="text-xs bg-blue-50 text-blue-700
                                 px-2 py-1 rounded-full">
                  {selected.length} elegido(s)
                </span>
              )}
            </div>
            <SlotPicker
              slots={data?.slots || []}
              selected={selected}
              onToggle={toggleSlot}
            />
          </div>

          {/* Botón de confirmar */}
          <button
            type="submit"
            disabled={submitting || selected.length === 0}
            className="btn-primary"
          >
            {submitting ? 'Confirmando...' : (
              wantsAccount && !user
                ? `Crear cuenta y confirmar ${selected.length} turno(s)`
                : `Confirmar ${selected.length} turno(s)`
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            {wantsAccount
              ? 'Al confirmar creás tu cuenta y quedás anotado en los turnos elegidos'
              : 'Sin cuenta — solo quedás anotado en los turnos elegidos'
            }
          </p>

        </form>
      </div>
    </div>
  );
}