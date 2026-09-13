"use server";

import { redirect } from "next/navigation";
import { requireRole, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewBooking } from "@/lib/notifications";
import {
  SESSION_MINUTES,
  TRACKS,
  isOpenOn,
  isTrackDay,
  slotAvailability,
  slotTimesFor,
} from "@/lib/booking";
import {
  getAllowance,
  getSubscription,
  hasFreeSessionAvailable,
} from "@/lib/subscription";
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

  // 2b. The subscription decides the capacity and the bookable weekdays. The
  //     calendar already filters both, so getting here means a stale page or
  //     a hand-made request. Either way the server decides, not the form.
  const sub = await getSubscription(me!.id);

  // A newcomer with no subscription may book exactly one session: the free
  // first one. Once that is held, no plan means no booking, as before.
  const isTrial = sub.configured && !sub.plan;
  if (isTrial && !(await hasFreeSessionAvailable(me!.id))) {
    return {
      error:
        "Your free session has already been used. Ask the studio to set up a subscription.",
    };
  }
  if (!isTrackDay(weekday, sub.track)) {
    const days = sub.track ? TRACKS[sub.track].short : "your scheduled days";
    return { error: `Your plan trains on ${days}.` };
  }
  if (sub.expired) {
    return {
      error:
        "Your subscription has ended. Ask the studio to renew it and you can book again.",
    };
  }

  // 2c. Session allowance, counted over the week and the subscription month
  //     that the chosen day falls in. The free trial is a single session and
  //     belongs to no subscription month, so the caps do not apply to it.
  if (!isTrial) {
    const allowance = await getAllowance(me!.id, sub.endsOn, date);
    if (allowance.monthFull) {
      return {
        error: `You have used all ${allowance.monthLimit} sessions in this subscription month.`,
      };
    }
    if (allowance.weekFull) {
      return {
        error: `You have used all ${allowance.weekLimit} sessions for that week.`,
      };
    }
  }

  // 3. Enforce the per-slot capacity (needs admin to see all clients'
  //    bookings, since RLS would hide other clients' rows).
  const admin = createAdminClient();
  const { data: sameSlot } = await admin
    .from("bookings")
    // `plan` only exists once subscriptions.sql has been run.
    .select(sub.configured ? "id, client_id, plan" : "id, client_id")
    .eq("coach_id", coachId)
    .eq("starts_at", starts.toISOString())
    .in("status", ["pending", "confirmed"]);

  const occupants = (sameSlot ?? []) as unknown as {
    client_id: string;
    plan?: string | null;
  }[];

  if (occupants.some((b) => b.client_id === me!.id)) {
    return { error: "You've already booked this time." };
  }
  const { remaining, blockedByOtherPlan } = slotAvailability(
    occupants as { plan?: null }[],
    sub.plan,
    { trial: isTrial },
  );
  if (blockedByOtherPlan) {
    return {
      error:
        "That hour is running as a different session type. Please pick another.",
    };
  }
  if (remaining <= 0) {
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
      // Snapshot the plan so a later change does not rewrite past sessions.
      ...(sub.configured ? { plan: sub.plan } : {}),
      // Only ever true when the column exists: hasFreeSessionAvailable()
      // returns false without it, so isTrial cannot be set.
      ...(isTrial ? { is_free: true } : {}),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Notify the coach on WhatsApp (best-effort; never blocks the booking).
  if (inserted) await notifyNewBooking(inserted.id);

  redirect("/client/bookings?booked=1");
}
