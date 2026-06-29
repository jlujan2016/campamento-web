import { api } from './client';
import type {
  Event, EventMember, PersonMetrics,
  RankingEntry, ScheduleSlot
} from '../types';

export const eventsApi = {
  list: () => api.get<Event[]>('/events'),

  get: (id: string) => api.get<Event>(`/events/${id}`),

  join: (id: string) => api.post<EventMember>(`/events/${id}/join`, {}),

  members: (id: string) => api.get<EventMember[]>(`/events/${id}/members`),

  slots: (id: string) => api.get<ScheduleSlot[]>(`/events/${id}/slots`),

  signupSlots: (id: string, slot_ids: string[]) =>
    api.post(`/events/${id}/signup-slots`, { slot_ids }),

  metrics: (id: string) => api.get<PersonMetrics[]>(`/events/${id}/metrics`),

  ranking: (id: string) => api.get<RankingEntry[]>(`/events/${id}/ranking`),

  // Enlace público (sin token)
  publicSchedule: (token: string) =>
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/schedule/${token}`)
      .then(r => r.json()),
};