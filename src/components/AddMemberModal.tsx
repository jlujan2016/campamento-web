import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/admin';
import { X, Search, UserPlus, RefreshCw } from 'lucide-react';

interface UserResult {
  id: string;
  name: string;
  email: string | null;
  is_guest: boolean;
}

interface Props {
  eventId: string;
  onAdded: () => void;
  onClose: () => void;
}

export default function AddMemberModal({ eventId, onAdded, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await adminApi.listUsers(search);
        // Excluimos invitados — solo tiene sentido agregar cuentas reales
        setResults(data.filter((u: UserResult) => !u.is_guest));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [search]);

  const handleAdd = async (user: UserResult) => {
    setAdding(user.id);
    setError('');
    try {
      await adminApi.addMember(eventId, user.id);
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Agregar miembro</h2>
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

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="overflow-y-auto flex-1 space-y-2">
          {loading && (
            <RefreshCw className="w-5 h-5 animate-spin text-gray-300 mx-auto my-4" />
          )}

          {!loading && search.trim().length >= 2 && results.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              No se encontraron usuarios
            </p>
          )}

          {!loading && search.trim().length < 2 && (
            <p className="text-gray-300 text-xs text-center py-4">
              Escribí al menos 2 letras para buscar
            </p>
          )}

          {results.map(u => (
            <button
              key={u.id}
              onClick={() => handleAdd(u)}
              disabled={adding === u.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl
                         bg-gray-50 active:bg-gray-100 disabled:opacity-50"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center
                              justify-center font-semibold text-blue-700 text-sm">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <UserPlus className="w-4 h-4 text-blue-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}