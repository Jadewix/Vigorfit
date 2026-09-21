import type { Plan, ScheduleTrack } from "@/shared/booking";

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
  /** Subscription. Optional: absent until supabase/subscriptions.sql runs. */
  plan?: Plan | null;
  /** Which weekdays this client may book. See TRACKS in shared/booking. */
  schedule_track?: ScheduleTrack | null;
  /** "Paid until" date. Absent until subscription-limits.sql has run. */
  subscription_ends_on?: string | null;
  created_at: string;
}

export interface Coach {
  id: string;
  bio: string | null;
  specialty: string | null;
  hourly_rate: number | null;
  active: boolean;
  /** Public photo URL in the coach-photos bucket. Absent until
   *  supabase/coach-photos.sql has been run on the database. */
  avatar_url?: string | null;
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
  /** The subscription this session was booked under, snapshotted at
   *  booking time so a later plan change doesn't rewrite history. */
  plan?: Plan | null;
  /** The client's one free first session. The booking action writes it; rows
   *  made before the column existed simply lack it, so read it as falsy
   *  rather than as a recorded "not a trial". */
  is_free?: boolean | null;
  created_at: string;
}
