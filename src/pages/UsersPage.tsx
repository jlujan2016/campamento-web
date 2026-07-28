import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/admin';
import {
  ArrowLeft, Search, Plus, Lock, LockOpen,
  Trash2, RefreshCw, ShieldCheck, UserX
} from 'lucide-react';
import CreateUserModal from '../components/CreateUserModal';

interface UserRow {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  is_super_admin: boolean;
  is_guest: boolean;
  is_blocked: boolean;
  created_at: string;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'} | null>(null);

  // Referencia al timer del debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async (query?: string) => {
    try {
      const data = await adminApi.listUsers(query);
      setUsers(data);
    } catch (err: any) {
      showToast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // Debounce: espera 300ms después de la última tecla antes de buscar
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadUsers(value);
    }, 300);
  };

  const handleBlock = async (u: UserRow) => {
    try {
      const res = await adminApi.blockUser(u.id);
      showToast(res.message);
      loadUsers(search);
    } catch (err: any) {
      showToast(err.message, 'err');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await adminApi.deleteUser(confirmDelete.id);
      showToast(`${confirmDelete.name} eliminado permanentemente`);
      setConfirmDelete(null);
      loadUsers(search);
    } catch (err: any) {
      showToast(err.message, 'err');
      setConfirmDelete(null);
    }
  };

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
            <h1 className="text-xl font-bold">Usuarios</h1>
            <p className="text-blue-100 text-sm">
              {users.length} usuario(s) en la plataforma
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 bg-white text-blue-600
                       px-3 py-1.5 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* Buscador con debounce */}
        <div className="card">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div key={u.id}
                  className={`card ${u.is_blocked ? 'opacity-60 border-red-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center
                                    justify-center font-semibold text-sm flex-shrink-0
                      ${u.is_super_admin
                        ? 'bg-purple-100 text-purple-700'
                        : u.is_guest
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{u.name}</p>
                        {u.is_super_admin && (
                          <ShieldCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        )}
                        {u.is_blocked && (
                          <span className="text-xs bg-red-50 text-red-600
                                           px-2 py-0.5 rounded-full flex-shrink-0">
                            Bloqueado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {u.email || (u.is_guest ? `Invitado · ${u.phone || 'sin tel.'}` : 'Sin email')}
                      </p>
                    </div>

                    {/* Acciones — no disponibles sobre uno mismo */}
                    {!isSelf && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleBlock(u)}
                          title={u.is_blocked ? 'Desbloquear' : 'Bloquear'}
                          className={`p-2 rounded-xl
                            ${u.is_blocked
                              ? 'bg-green-50 text-green-600'
                              : 'bg-amber-50 text-amber-600'
                            }`}
                        >
                          {u.is_blocked
                            ? <LockOpen className="w-4 h-4" />
                            : <Lock className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          title="Eliminar permanentemente"
                          className="p-2 rounded-xl bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="card text-center py-10">
                <UserX className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No se encontraron usuarios
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {showModal && (
        <CreateUserModal
          isSuperAdmin={currentUser?.is_super_admin || false}
          onCreated={() => loadUsers(search)}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Confirmación de eliminación — acción destructiva pide doble confirmación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center px-6">
          <div className="bg-white w-full rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-lg">¿Eliminar a {confirmDelete.name}?</h3>
            <p className="text-sm text-gray-500">
              Esta acción es <strong>permanente</strong>. Se borrarán todos sus
              turnos, check-ins, aportes e historial. Si solo querés impedirle
              el acceso, usá "Bloquear" en su lugar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5
                           rounded-xl text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2.5
                           rounded-xl text-sm font-semibold"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

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