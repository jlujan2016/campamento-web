import { api } from './client';
import type { Event } from '../types';

export interface CreateEventData {
  name: string;
  venue_name: string;
  lat: number;
  lng: number;
  start_date: string;
  end_date: string;
  min_shift_hours: number;
  max_shift_hours?: number;
  min_total_hours?: number;
  late_tolerance_minutes: number;
  night_start_time?: string;
  night_end_time?: string;
  requires_night_shift: boolean;
}

export interface CreateSlotData {
  start_time: string;
  end_time: string;
  capacity: number;
}

export interface CreateContributionTypeData {
  type_key: string;
  label: string;
  default_hour_bonus: number;
}

export const adminApi = {
  // Eventos
  createEvent: (data: CreateEventData) =>
    api.post<Event>('/events', data),

  updateEvent: (id: string, data: Partial<CreateEventData>) =>
    api.put<Event>(`/events/${id}`, data),

  // Cronograma
  createSlot: (eventId: string, data: CreateSlotData) =>
    api.post(`/events/${eventId}/slots`, data),

  generateScheduleLink: (eventId: string, hours: number) =>
    api.post(`/events/${eventId}/schedule-link`, { expires_in_hours: hours }),

  // Turnos
  listAllShifts: (eventId: string) =>
    api.get<any[]>(`/events/${eventId}/shifts/all`),

  approveExtraShift: (shiftId: string) =>
    api.put<any>(`/shifts/${shiftId}/approve`, {}),

  // Aportes
  listContributions: (eventId: string) =>
    api.get<any[]>(`/events/${eventId}/contributions`),

  approveContribution: (id: string, action: string, hour_bonus?: number) =>
    api.put(`/contributions/${id}/approve`, {
      action,
      hour_bonus_override: hour_bonus
    }),

  // Tipos de aporte
  createContributionType: (eventId: string, data: CreateContributionTypeData) =>
    api.post(`/events/${eventId}/contribution-types`, data),

  listContributionTypes: (eventId: string) =>
    api.get<any[]>(`/events/${eventId}/contribution-types`),

  // Miembros
  withdrawMember: (eventId: string, userId: string) =>
    api.post(`/events/${eventId}/members/${userId}/withdraw`, {}),
};