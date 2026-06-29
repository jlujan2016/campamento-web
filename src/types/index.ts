export interface User {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  is_super_admin: boolean;
  is_guest: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Event {
  id: string;
  name: string;
  venue_name: string;
  lat: number;
  lng: number;
  start_date: string;
  end_date: string;
  status: string;
  min_shift_hours: number;
  min_total_hours: number | null;
  late_tolerance_minutes: number;
  night_start_time: string | null;
  night_end_time: string | null;
  requires_night_shift: boolean;
}

export interface Shift {
  id: string;
  event_id: string;
  user_id: string;
  shift_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  adjustment_reason: string | null;
}

export interface Checkin {
  id: string;
  shift_id: string;
  user_id: string;
  checkin_type: string;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  timestamp: string;
}

export interface CheckinResponse {
  checkin: Checkin;
  message: string;
  effective_end: string | null;
  hours_so_far: number | null;
}

export interface PersonMetrics {
  user_id: string;
  user_name: string;
  user_email: string | null;
  hours_scheduled: number;
  hours_real: number;
  hours_with_final: number;
  hours_total: number;
  contributions_bonus: number;
  final_checkpoint_present: boolean;
  night_shift_completed: boolean;
  meets_minimum: boolean;
}

export interface RankingEntry {
  position: number;
  user_id: string;
  user_name: string;
  hours_total: number;
  hours_real: number;
  meets_minimum: boolean;
  night_shift_completed: boolean;
  final_checkpoint_present: boolean;
  is_eligible: boolean;
}

export interface ScheduleSlot {
  id: string;
  event_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  origin: string;
  status: string;
  signups_count: number;
  available_spots: number;
}

export interface EventMember {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  role: string;
  status: string;
  joined_at: string;
}