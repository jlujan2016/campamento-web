import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Tent } from 'lucide-react';
import ConcertBackground from '../components/ConcertBackground';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center px-6 py-12 overflow-hidden">
      {/* Fondo animado de concierto */}
      <ConcertBackground />

      {/* Contenido — z-10 para quedar encima del canvas */}
      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16
                          bg-red-600 rounded-2xl mb-4">
            <Tent className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Callate y baila! 🎵</h1>
          <p className="text-red-200 text-sm mt-1">Control de turnos para conciertos</p>
        </div>

        <div className="max-w-md mx-auto w-full bg-black/70 backdrop-blur-sm
                        border border-white/15 rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-4 text-white">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-200 block mb-1">
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200 block mb-1">
                Contraseña
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 px-4 rounded-xl
                         font-semibold active:bg-red-700 transition-colors
                         disabled:opacity-50 mt-2"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-300 mt-4">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-red-400 font-medium">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}