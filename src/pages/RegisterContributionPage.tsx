import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { api } from '../api/client';
import { ArrowLeft, Package, RefreshCw, CheckCircle } from 'lucide-react';

interface ContributionType {
  id: string;
  label: string;
  type_key: string;
  default_hour_bonus: number;
}

export default function RegisterContributionPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [types, setTypes] = useState<ContributionType[]>([]);
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    adminApi.listContributionTypes(eventId)
      .then(data => {
        setTypes(data);
        if (data.length > 0) setSelectedType(data[0]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !selectedType) return;
    setError('');
    setSubmitting(true);

    try {
      await api.post(`/events/${eventId}/contributions`, {
        contribution_type_id: selectedType.id,
        description: description || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  // Pantalla de éxito
  if (success) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center
                    justify-center px-6 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                      justify-center">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold">¡Aporte registrado!</h2>
      <p className="text-gray-500 text-sm">
        Tu aporte de <strong>{selectedType?.label}</strong> (+{selectedType?.default_hour_bonus}h)
        quedó pendiente de aprobación. El admin lo va a revisar pronto.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="btn-primary mt-4"
      >
        Volver al inicio
      </button>
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
        <h1 className="text-xl font-bold">Registrar aporte</h1>
        <p className="text-blue-100 text-sm">
          Los aportes suman horas a tu puntaje
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {types.length === 0 ? (
          <div className="card text-center py-8">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              El admin no configuró tipos de aporte para este evento todavía.
            </p>
          </div>
        ) : (
          <>
            {/* Selector de tipo */}
            <div className="card space-y-3">
              <h2 className="font-semibold">¿Qué vas a aportar?</h2>
              <div className="space-y-2">
                {types.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left p-3 rounded-xl border-2
                                transition-all flex items-center justify-between
                      ${selectedType?.id === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-white'
                      }`}
                  >
                    <span className={`font-medium text-sm
                      ${selectedType?.id === type.id
                        ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                      {type.label}
                    </span>
                    <span className="text-sm font-bold text-amber-600 bg-amber-50
                                     px-2 py-0.5 rounded-lg">
                      +{type.default_hour_bonus}h
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción opcional */}
            <div className="card space-y-2">
              <h2 className="font-semibold">Descripción (opcional)</h2>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Ej: Carpa para 4 personas, la azul grande"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Podés agregar detalles para que el admin pueda
                verificar el aporte más fácilmente.
              </p>
            </div>

            {/* Resumen antes de confirmar */}
            {selectedType && (
              <div className="card bg-amber-50 border border-amber-100">
                <p className="text-sm text-amber-700">
                  Vas a registrar:{' '}
                  <strong>{selectedType.label}</strong>
                  {' '}— sumará{' '}
                  <strong>+{selectedType.default_hour_bonus}h</strong>
                  {' '}a tu puntaje una vez aprobado.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !selectedType}
            >
              {submitting ? 'Registrando...' : 'Confirmar aporte'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}