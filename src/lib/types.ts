export type Role = "admin" | "coach" | "client";

/** Shared state for the sign-in form. */
export type LoginState = {
  error?: string;
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  role: Role;
  username: string | null;
  full_name: string | null;
  /** Internal synthetic email; never shown to users. */
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Coach {
  id: string;
  bio: string | null;
  specialty: string | null;
  hourly_rate: number | null;
  active: boolean;
  created_at: string;
}

/** A coach row joined with its profile. */
export interface CoachWithProfile extends Coach {
  profile: Profile;
}

export interface Availability {
  id: string;
  coach_id: string;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  coach_id: string;
  starts_at: string; // ISO timestamp
  ends_at: string; // ISO timestamp
  status: BookingStatus;
  notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
