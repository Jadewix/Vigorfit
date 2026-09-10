"use server";

import { redirect } from "next/navigation";
import { requireRole, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewBooking } from "@/lib/notifications";
import {
  SESSION_MINUTES,
  SLOT_CAPACITY,
  isOpenOn,
  slotTimesFor,
} from "@/lib/booking";
import { weekdayOf, zonedTimeToUtc } from "@/lib/timezone";

export type BookingState = { error?: string };

export async function createBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  await requireRole(["client"]);
  const me = await getCurrentProfile();

  const coachId = String(formData.get("coach_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const duration = SESSION_MINUTES; // fixed-length sessions
  const notes = String(formData.get("notes") ?? "").trim();

  if (!coachId || !date || !time) {
    return { error: "Please choose a date and time." };
  }

  // The date and time are on the studio's clock. `new Date()` would read them
  // on the server's clock instead, which is UTC on Workers, and store a
  // 10:00 AM session as 1:00 PM Beirut time.
  const starts = zonedTimeToUtc(date, time);
  if (!starts) {
    return { error: "That date/time is invalid." };
  }
  if (starts.getTime() < Date.now()) {
    return { error: "Please choose a time in the future." };
  }

  const ends = new Date(starts.getTime() + duration * 60_000);

  const supabase = await createClient();

  // 1. Confirm the coach exists and is accepting bookings.
  const { data: coach } = await supabase
    .from("coaches")
    .select("id, active")
    .eq("id", coachId)
    .single();
  if (!coach || !coach.active) {
    return { error: "This coach isn't accepting bookings right now." };
  }

  // 2. The chosen time must be a real slot in the studio's opening hours.
  const weekday = weekdayOf(date);
  if (!isOpenOn(weekday)) {
    return { error: "The studio is closed that day." };
  }
  if (!slotTimesFor(weekday).includes(time)) {
    return { error: "Please pick one of the offered time slots." };
  }

  // 3. Enforce the per-slot capacity (needs admin to see all clients'
  //    bookings, since RLS would hide other clients' rows).
  const admin = createAdminClient();
  const { data: sameSlot } = await admin
    .from("bookings")
    .select("id, client_id")
    .eq("coach_id", coachId)
    .eq("starts_at", starts.toISOString())
    .in("status", ["pending", "confirmed"]);

  if (sameSlot?.some((b) => b.client_id === me!.id)) {
    return { error: "You've already booked this time." };
  }
  if ((sameSlot?.length ?? 0) >= SLOT_CAPACITY) {
    return { error: "That time is fully booked. Please pick another." };
  }

  // 4. Insert as the client (RLS validates client_id = self).
  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      client_id: me!.id,
      coach_id: coachId,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      notes: notes || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Notify the coach on WhatsApp (best-effort; never blocks the booking).
  if (inserted) await notifyNewBooking(inserted.id);

  redirect("/client/bookings?booked=1");
}
