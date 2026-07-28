import { useState } from 'react';
import { adminApi } from '../api/admin';
import { X, Eye, EyeOff } from 'lucide-react';

interface Props {
  isSuperAdmin: boolean;   // si quien crea es super admin, puede crear admins
  onCreated: () => void;
  onClose: () => void;
}

export default function CreateUserModal({ isSuperAdmin, onCreated, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [asAdmin, setAsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await adminApi.createUser({
        email,
        password,
        name,
        phone: phone || undefined,
        is_super_admin: asAdmin,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo usuario</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            className="input"
            placeholder="Nombre completo *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className="input"
            placeholder="Email *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            className="input"
            placeholder="Teléfono (opcional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Contraseña (mín. 8 caracteres) *"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
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

          {/* Solo el super admin puede crear otros super admins */}
          {isSuperAdmin && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={asAdmin}
                onChange={e => setAsAdmin(e.target.checked)}
                className="rounded"
              />
              Crear como super admin (acceso total a la plataforma)
            </label>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando...' : '+ Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}