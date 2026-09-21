/**
 * Every session is a fixed length (shown to users, not used to space slots).
 *
 * Slots run hourly on the hour, so at 60 minutes a session now fills exactly
 * one slot. It used to run 70, which meant every booking overlapped the ten
 * minutes at the start of the next one.
 */
export const SESSION_MINUTES = 60;
export const SESSION_LABEL = "60 minutes";

/**
 * What every client is asked to do before their session, shown wherever the
 * booking flow talks about the time. One string, so the calendar note, the
 * confirm button's small print and the bookings list all word it the same way.
 */
export const ARRIVAL_NOTE = "Please arrive 5 to 10 minutes early.";

/* --------------------------------------------------------------- plans --- */

export type Plan = "semi_private" | "classes" | "private";

/**
 * The three subscriptions. `capacity` is how many clients may share one time
 * slot with the same coach — one, for the fully private plan, which is the
 * whole thing being sold. `perWeek` is the sessions the plan is priced for,
 * and it is the same three across all of them: a schedule track runs three
 * days a week, which is where MONTHLY_SESSION_LIMIT's 3 x 4 comes from.
 *
 * `priceUsd` is display-only — there is no billing in this app; the studio
 * takes payment outside it.
 */
export const PLANS: Record<
  Plan,
  { label: string; priceUsd: number; capacity: number; perWeek: number }
> = {
  semi_private: {
    label: "Semi-private",
    priceUsd: 120,
    capacity: 4,
    perWeek: 3,
  },
  classes: { label: "Classes", priceUsd: 40, capacity: 8, perWeek: 3 },
  private: { label: "Fully private", priceUsd: 200, capacity: 1, perWeek: 3 },
};

export const PLAN_VALUES = Object.keys(PLANS) as Plan[];

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && value in PLANS;
}

/**
 * How many sessions one client may hold.
 *
 * The month is the subscription month (the one ending on their renewal
 * date), not the calendar month. The week is Monday to Sunday on the
 * studio's clock. Cancelled bookings never count; pending, confirmed and
 * completed ones do.
 *
 * Note the shape of these two: a track runs three days a week, so 3 x 4
 * weeks is exactly the monthly allowance, and the weekly cap of 4 only comes
 * into play when someone books twice in one day to make up a session.
 */
export const MONTHLY_SESSION_LIMIT = 12;
export const WEEKLY_SESSION_LIMIT = 4;

/** How many days before the end date the client is warned. */
export const EXPIRY_REMINDER_DAYS = 7;

/* ------------------------------------------------- cancellation policy --- */

/**
 * How much notice a client must give to cancel or move a session. Inside this
 * window the booking is locked: the studio has already held the hour and the
 * coach has written the session.
 *
 * The lock is enforced in `cancelBookingAction`, not only in the page that
 * hides the button — a stale tab would otherwise still carry a live form.
 */
export const CANCELLATION_NOTICE_HOURS = 24;

/**
 * Cancellations and reschedules included in the subscription month. Past
 * these the studio charges for the change; the app has no billing, so what it
 * does with the number is warn before the change and record it after.
 *
 * Rescheduling is a cancel and a re-book here — there is no separate move
 * action — so both spend from this one count, which is what makes "3 free
 * cancellations and reschedules" a single figure rather than two.
 */
export const FREE_CHANGES_LIMIT = 3;

/** The instant a session stops being cancellable. */
export function cancellationDeadline(startsAt: string | Date): Date {
  const starts =
    typeof startsAt === "string" ? new Date(startsAt) : new Date(startsAt);
  return new Date(
    starts.getTime() - CANCELLATION_NOTICE_HOURS * 60 * 60_000,
  );
}

/**
 * Whether a session may still be cancelled or moved. Both the bookings page
 * and the server action read this, so the button and the rule can never
 * disagree.
 */
export function canCancel(
  startsAt: string | Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() < cancellationDeadline(startsAt).getTime();
}

/* -------------------------------------------------------------- tracks --- */

export type ScheduleTrack = "mwf" | "tts";

/** Which weekdays each schedule track runs on (0 = Sunday). */
export const TRACKS: Record<
  ScheduleTrack,
  { label: string; short: string; weekdays: number[] }
> = {
  mwf: {
    label: "Monday, Wednesday, Friday",
    short: "Mon · Wed · Fri",
    weekdays: [1, 3, 5],
  },
  tts: {
    label: "Tuesday, Thursday, Saturday",
    short: "Tue · Thu · Sat",
    weekdays: [2, 4, 6],
  },
};

export const TRACK_VALUES = Object.keys(TRACKS) as ScheduleTrack[];

export function isTrack(value: unknown): value is ScheduleTrack {
  return typeof value === "string" && value in TRACKS;
}

/**
 * Whether one session type owns a slot exclusively.
 *
 *   true  — the first booking claims that hour as semi-private *or* class, and
 *           clients on the other plan see it as unavailable.
 *   false — the two are counted separately, so one coach could hold 4
 *           semi-private and 8 class clients in the same hour.
 *
 * PENDING: the studio hasn't decided yet. Flipping this constant is the whole
 * change — `bookings.plan` records each session's type either way, so no data
 * has to be rebuilt when the decision lands.
 */
export const SLOT_EXCLUSIVE_BY_PLAN = true;

/**
 * Capacity used for clients with no subscription recorded — which also covers
 * the window before `supabase/subscriptions.sql` has been run.
 */
export const LEGACY_SLOT_CAPACITY = 2;

/** How many clients may share one slot under a given plan. */
export function capacityFor(plan: Plan | null | undefined): number {
  return plan ? PLANS[plan].capacity : LEGACY_SLOT_CAPACITY;
}

/** A booking already sitting in a slot, as far as capacity is concerned. */
export type SlotOccupant = { plan?: Plan | null };

/**
 * How a slot looks to a client on `plan`, given who is already in it.
 *
 * Both the slots API and the booking action go through here, so the calendar
 * can never disagree with what the server will accept. Bookings made before
 * subscriptions existed have a null plan: they occupy space but never block a
 * slot on the grounds of being "the other type".
 */
export function slotAvailability(
  occupants: SlotOccupant[],
  plan: Plan | null | undefined,
  options: { trial?: boolean } = {},
): { remaining: number; blockedByOtherPlan: boolean } {
  // A trial client has no plan of their own, so they join whatever session
  // already owns the hour, or a class if it is empty. Without this they
  // would be measured against LEGACY_SLOT_CAPACITY and a half-full class
  // of 8 would look full to them.
  const effective: Plan | null | undefined = options.trial
    ? (occupants.find((o) => o.plan != null)?.plan ?? "classes")
    : plan;
  const capacity = capacityFor(effective);

  if (SLOT_EXCLUSIVE_BY_PLAN) {
    const otherType = occupants.some(
      (o) => o.plan != null && effective != null && o.plan !== effective,
    );
    if (otherType) return { remaining: 0, blockedByOtherPlan: true };
    return {
      remaining: Math.max(0, capacity - occupants.length),
      blockedByOtherPlan: false,
    };
  }

  // Sharing allowed: each plan is counted against its own capacity.
  const sameType = occupants.filter(
    (o) => o.plan == null || effective == null || o.plan === effective,
  ).length;
  return {
    remaining: Math.max(0, capacity - sameType),
    blockedByOtherPlan: false,
  };
}

/* --------------------------------------------------------------- hours --- */

/**
 * Studio opening hours by weekday (0 = Sunday). Values are the first and last
 * bookable slot hour; slots run hourly on the hour. null = closed that day.
 *
 * This is the ONLY place opening hours are written down. The booking grid
 * offers slots straight from it, and every hours list on the site — the
 * marketing page, the footer, the coach and booking panels — is derived from
 * it in `shared/studio.ts`, along with the live "open now" line. The marketing
 * side used to carry its own second copy, which drifted to 9–5 while the
 * grid went on selling 8–6.
 */
export const HOURS: Record<number, { first: number; last: number } | null> = {
  0: null, // Sunday — closed
  1: { first: 8, last: 18 }, // Mon  8:00 AM – 6:00 PM
  2: { first: 8, last: 18 },
  3: { first: 8, last: 18 },
  4: { first: 8, last: 18 },
  5: { first: 8, last: 18 },
  6: { first: 8, last: 15 }, // Sat  8:00 AM – 3:00 PM
};

export function isOpenOn(weekday: number): boolean {
  return HOURS[weekday] != null;
}

/**
 * Whether a weekday falls on the client's schedule track.
 *
 * This is a *preference*, not a gate. A member on Mon-Wed-Fri who has to move
 * a session may book any day the studio is open; the booking flow marks the
 * off-track days and asks them to keep to their plan, and both the slots API
 * and the booking action go on serving them. It used to be a hard block —
 * the calendar struck the days out and the server rejected them — which left
 * someone who simply could not make Wednesday with nowhere to go but WhatsApp.
 */
export function isTrackDay(
  weekday: number,
  track: ScheduleTrack | null | undefined,
): boolean {
  // No track recorded yet: opening hours are the only limit.
  if (!track) return true;
  return TRACKS[track].weekdays.includes(weekday);
}

/** The line shown when a member picks a day outside their plan's days. */
export function offTrackNote(track: ScheduleTrack): string {
  return `This is outside your plan's days — preferably stick to ${TRACKS[track].short}.`;
}

/** Bookable start times for a weekday, e.g. ["08:00", "09:00", ...]. */
export function slotTimesFor(weekday: number): string[] {
  const h = HOURS[weekday];
  if (!h) return [];
  const times: string[] = [];
  for (let hour = h.first; hour <= h.last; hour++) {
    times.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return times;
}

