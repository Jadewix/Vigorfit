/**
 * The coach's week, assembled from their bookings.
 *
 * All of the arithmetic for the weekly schedule lives here rather than in the
 * page, because the page renders it twice — an agenda on phones, a grid from
 * `lg` — and two layouts reading the same numbers is exactly how the two drift
 * apart. They both take the model below.
 *
 * The unit is the SLOT, not the booking. A semi-private hour holds four
 * clients and a class holds eight, so "9am Monday" is one thing the coach does
 * with several people in it; listing it as four rows would describe four
 * sessions that do not exist.
 */
import { PLANS, capacityFor, isOpenOn, slotTimesFor, type Plan } from "@/shared/booking";
import { shiftDate, utcToZonedTime, weekdayOf } from "@/shared/timezone";
import type { Booking } from "@/shared/types";

/** One client's place in a slot, with what the coach needs beside the name. */
export type ScheduleEntry = {
  booking: Booking;
  clientName: string;
  /** As stored — the schedule dials it rather than messaging it. */
  clientPhone: string | null;
};

export type ScheduleSlot = {
  /** Start on the studio's clock, "HH:MM". Session times come off the
   *  bookings themselves; this is the key the grid places the block on. */
  time: string;
  entries: ScheduleEntry[];
  /** What this hour is running as; null when no entry records a plan. */
  plan: Plan | null;
  capacity: number;
  /** Places held. Every entry counts — cancelled ones never reach a slot. */
  taken: number;
  /** How many of those are still waiting on the coach to confirm. */
  pending: number;
};

export type ScheduleDay = {
  /** "YYYY-MM-DD" on the studio's clock. */
  date: string;
  /** 0 = Sunday. */
  weekday: number;
  open: boolean;
  /** The hours the studio sells on this weekday — the grid draws the rest of
   *  the column as closed rather than as free. */
  sells: string[];
  /** Only the hours that hold something, ascending. */
  slots: ScheduleSlot[];
  /** Places held across the day, which is people rather than hours. */
  sessions: number;
};

export type ScheduleWeek = {
  /** Monday, "YYYY-MM-DD". */
  start: string;
  /** Sunday, "YYYY-MM-DD". */
  end: string;
  days: ScheduleDay[];
  /** Every hour any listed day sells, ascending — the grid's rows. */
  hours: string[];
  sessions: number;
  clients: number;
  pending: number;
  /** Counted, never placed. See the note in `buildWeek`. */
  cancelled: number;
  busiest: ScheduleDay | null;
};

/**
 * Build one week's model.
 *
 * `bookings` should already be narrowed to this coach and this week; the page
 * asks the database for exactly that range rather than filtering a full
 * history in memory.
 */
export function buildWeek(
  monday: string,
  bookings: Booking[],
  lookup: (clientId: string) => { name: string; phone: string | null },
): ScheduleWeek {
  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(monday, i)!);

  /*
    Cancelled sessions are counted at the top of the page and then dropped.
    A weekly schedule answers "what am I doing", and a cancelled hour is not
    something the coach does — leaving it in would also inflate the occupancy
    figures, so an hour that four people dropped out of would read as full.
    The figure links to /coach/bookings?status=cancelled, which is the view
    that does list them.
  */
  const active = bookings.filter((b) => b.status !== "cancelled");
  const cancelled = bookings.length - active.length;

  // date -> "HH:MM" -> the people in that hour.
  const byDate = new Map<string, Map<string, ScheduleEntry[]>>();
  for (const booking of active) {
    const { date, time } = utcToZonedTime(booking.starts_at);
    let byTime = byDate.get(date);
    if (!byTime) byDate.set(date, (byTime = new Map()));
    const { name, phone } = lookup(booking.client_id);
    const entries = byTime.get(time) ?? [];
    entries.push({ booking, clientName: name, clientPhone: phone });
    byTime.set(time, entries);
  }

  const days: ScheduleDay[] = [];
  for (const date of dates) {
    const weekday = weekdayOf(date);
    const open = isOpenOn(weekday);
    const byTime = byDate.get(date);

    /*
      A closed day with nothing on it earns neither a column nor a card —
      that is what keeps Sunday out of the grid without naming Sunday
      anywhere. A closed day WITH sessions still appears: opening hours can
      change after a booking is taken, and a session the coach cannot see is
      a worse outcome than an odd-looking column.
    */
    if (!open && !byTime) continue;

    const slots: ScheduleSlot[] = [...(byTime?.entries() ?? [])]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, entries]) => {
        // The hour takes its plan from whoever in it has one recorded.
        // Bookings made before subscriptions existed carry none, and an hour
        // of those falls back to the legacy capacity rather than to a guess.
        const plan =
          entries.find((e) => e.booking.plan != null)?.booking.plan ?? null;
        return {
          time,
          entries,
          plan,
          capacity: capacityFor(plan),
          taken: entries.length,
          pending: entries.filter((e) => e.booking.status === "pending").length,
        };
      });

    days.push({
      date,
      weekday,
      open,
      sells: slotTimesFor(weekday),
      slots,
      sessions: slots.reduce((n, s) => n + s.taken, 0),
    });
  }

  /*
    Grid rows: every hour the listed days sell, plus any hour that actually
    holds a session. The second half matters for the same reason as the
    closed-day rule above — a booking outside today's opening hours still
    needs a row to land on, or it silently disappears from the week.
  */
  const hours = new Set<string>();
  for (const day of days) {
    for (const time of day.sells) hours.add(time);
    for (const slot of day.slots) hours.add(slot.time);
  }

  // Ties go to the earlier day, since `>` only replaces on a strict win.
  const busiest = days.reduce<ScheduleDay | null>(
    (best, day) => (day.sessions > (best?.sessions ?? 0) ? day : best),
    null,
  );

  return {
    start: monday,
    end: dates[6],
    days,
    hours: [...hours].sort(),
    sessions: active.length,
    clients: new Set(active.map((b) => b.client_id)).size,
    pending: active.filter((b) => b.status === "pending").length,
    cancelled,
    busiest,
  };
}

/* ------------------------------------------------------------- labels --- */

/*
  Dates here are "YYYY-MM-DD" strings on the studio's clock, already resolved
  by `utcToZonedTime`. They are formatted by reading the string rather than by
  parsing it back into a Date: `new Date("2026-09-15")` is UTC midnight, and
  putting that through a formatter is one timezone assumption away from
  printing the day before. There is no instant here to get wrong.
*/
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Monday" for a "YYYY-MM-DD" date. */
export function weekdayName(date: string): string {
  return WEEKDAY_NAMES[weekdayOf(date)] ?? "";
}

/** "15 Sep" for a "YYYY-MM-DD" date. */
export function dayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(day)} ${MONTH_NAMES[Number(month) - 1]}`;
}

/** Just the day number, e.g. "15" — the grid's column heading. */
export function dayNumber(date: string): string {
  return String(Number(date.split("-")[2]));
}

/**
 * The week as one line: "15 – 21 Sep 2026", widening to name both months, and
 * both years, only when the week actually crosses one.
 */
export function weekRangeLabel(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-");
  const [ey, em, ed] = end.split("-");
  const startMonth = MONTH_NAMES[Number(sm) - 1];
  const endMonth = MONTH_NAMES[Number(em) - 1];
  if (sy === ey && sm === em) {
    return `${Number(sd)} – ${Number(ed)} ${endMonth} ${ey}`;
  }
  if (sy === ey) {
    return `${Number(sd)} ${startMonth} – ${Number(ed)} ${endMonth} ${ey}`;
  }
  return `${Number(sd)} ${startMonth} ${sy} – ${Number(ed)} ${endMonth} ${ey}`;
}

/**
 * "08:00" -> "8 AM", for the grid's hour rows.
 *
 * Only for labelling a row that may hold nothing. A real session prints its
 * own start and end through `formatTime`, which reads the booking's instant
 * on the studio's clock.
 */
export function hourLabel(time: string): string {
  const hour = Number(time.slice(0, 2));
  return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

/** "Semi-private", "Classes", or "Session" when no plan was recorded. */
export function planLabel(plan: Plan | null): string {
  return plan ? PLANS[plan].label : "Session";
}

/*
  The same thing in a grid column's worth of room. "Semi-private" needs about
  90px beside its occupancy figure and the column is nearer 110px all in, so
  the full label spent the cell's whole width on a word the coach already
  knows from the shape of the hour. The agenda, which has the room, still
  prints it in full.
*/
const PLAN_SHORT: Record<Plan, string> = {
  semi_private: "Semi",
  classes: "Class",
  private: "Private",
};

/** "Semi", "Class", or "Session" — the grid's form of `planLabel`. */
export function planShortLabel(plan: Plan | null): string {
  return plan ? PLAN_SHORT[plan] : "Session";
}
