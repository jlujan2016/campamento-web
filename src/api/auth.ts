import { api } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, name: string, phone?: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name, phone }),

  me: () => api.get<User>('/auth/me'),
};