import { api } from './client';
import type { CheckinResponse, Shift } from '../types';

export const shiftsApi = {
  myShifts: (eventId: string) =>
    api.get<Shift[]>(`/events/${eventId}/shifts`),

  checkin: (shiftId: string, lat?: number, lng?: number, accuracy_m?: number) =>
    api.post<CheckinResponse>(`/shifts/${shiftId}/checkin`, {
      lat, lng, accuracy_m
    }),

  checkout: (shiftId: string, lat?: number, lng?: number) =>
    api.post<CheckinResponse>(`/shifts/${shiftId}/checkout`, { lat, lng }),

  activePresence: (eventId: string) =>
    api.get(`/events/${eventId}/shifts/active`),

  createExtra: (eventId: string, scheduled_start: string, scheduled_end: string, notes?: string) =>
    api.post<Shift>(`/events/${eventId}/shifts`, {
      scheduled_start, scheduled_end, notes
    }),
};