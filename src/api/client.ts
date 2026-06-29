const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cliente base que agrega el token JWT automáticamente
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // 204 No Content — no hay body
  if (response.status === 204) return {} as T;

  return response.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
};