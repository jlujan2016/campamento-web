import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Tent } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-gray-50">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16
                        bg-blue-600 rounded-2xl mb-4">
          <Tent className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Campamento App</h1>
        <p className="text-gray-500 text-sm mt-1">Creá tu cuenta</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Registro</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              className="input"
              placeholder="Tu nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
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
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary mt-2"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-blue-600 font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}