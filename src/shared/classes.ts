/**
 * Classes the admin puts on a coach's timetable.
 *
 * A class is a date and a start/end time on the studio's clock, optionally
 * repeating every week on that date's weekday. While it runs, its coach is
 * off the booking grid: any hourly slot that overlaps it is unavailable to
 * every client, whatever their plan.
 *
 * Times stay as studio wall-clock strings ("YYYY-MM-DD", "HH:MM") rather
 * than instants, because that is how slots are keyed too — comparing like
 * with like means daylight saving never enters into it.
 */
import { SESSION_MINUTES } from "@/shared/booking";
import { shiftDate, weekdayOf } from "@/shared/timezone";

export interface StudioClass {
  id: string;
  name: string;
  description: string | null;
  coach_id: string;
  /** The (first) day it runs, "YYYY-MM-DD". */
  class_date: string;
  /** "HH:MM" or "HH:MM:SS", as Postgres returns a `time`. */
  start_time: string;
  end_time: string;
  /** Runs every week on class_date's weekday, from class_date on. */
  repeats_weekly: boolean;
  created_at: string;
}

/** "HH:MM[:SS]" as minutes after midnight. */
function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "HH:MM" whatever Postgres added. */
function shortTime(time: string): string {
  return time.slice(0, 5);
}

/** Whether a class takes place on `date`. */
export function runsOn(cls: StudioClass, date: string): boolean {
  if (!cls.repeats_weekly) return cls.class_date === date;
  // Dates are zero-padded ISO strings, so string order is date order.
  return date >= cls.class_date && weekdayOf(date) === weekdayOf(cls.class_date);
}

/** Whether a session starting at `time` on `date` would overlap a class. */
export function classBlocksSlot(
  cls: StudioClass,
  date: string,
  time: string,
): boolean {
  if (!runsOn(cls, date)) return false;
  const start = minutesOf(time);
  const end = start + SESSION_MINUTES;
  return start < minutesOf(cls.end_time) && end > minutesOf(cls.start_time);
}

/** The class (if any) that takes the coach away at `time` on `date`. */
export function blockingClass(
  classes: StudioClass[],
  date: string,
  time: string,
): StudioClass | undefined {
  return classes.find((c) => classBlocksSlot(c, date, time));
}

/* ------------------------------------------------------------- labels --- */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "08:00" -> "8:00 AM". */
function clockLabel(time: string): string {
  const [h, m] = shortTime(time).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Every Monday from 28 Sep 2026" or "Monday 28 Sep 2026". */
export function whenLabel(cls: StudioClass): string {
  const [y, mo, d] = cls.class_date.split("-").map(Number);
  const day = WEEKDAYS[weekdayOf(cls.class_date)];
  const date = `${d} ${MONTHS[mo - 1]} ${y}`;
  return cls.repeats_weekly ? `Every ${day} from ${date}` : `${day} ${date}`;
}

/** "6:00 PM – 7:00 PM". */
export function timeRangeLabel(cls: StudioClass): string {
  return `${clockLabel(cls.start_time)} – ${clockLabel(cls.end_time)}`;
}

/* ------------------------------------------------------ client view --- */

export type ClassOccurrence = { date: string; cls: StudioClass };

/**
 * Every time a class meets over the next `days` days from `today`, in order.
 * Classes that already started today are left out: there is nothing left to
 * join.
 */
export function upcomingOccurrences(
  classes: StudioClass[],
  today: string,
  nowTime: string,
  days = 14,
): ClassOccurrence[] {
  const out: ClassOccurrence[] = [];
  for (let i = 0; i < days; i++) {
    const date = shiftDate(today, i)!;
    for (const cls of classes) {
      if (!runsOn(cls, date)) continue;
      if (i === 0 && shortTime(cls.start_time) <= nowTime) continue;
      out.push({ date, cls });
    }
  }
  return out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.cls.start_time.localeCompare(b.cls.start_time),
  );
}

/** "Monday 28 Sep". */
export function dateLabel(date: string): string {
  const [, mo, d] = date.split("-").map(Number);
  return `${WEEKDAYS[weekdayOf(date)]} ${d} ${MONTHS[mo - 1]}`;
}

/** What a Classes member sends the studio to say they are coming. */
export function comingMessage(
  who: string,
  { date, cls }: ClassOccurrence,
): string {
  return `Hi Vigorfit, this is ${who}. I'm coming to ${cls.name} on ${dateLabel(date)} at ${clockLabel(cls.start_time)}.`;
}

/** What anyone else sends to get onto (or back onto) the Classes plan. */
export function enrollMessage(
  who: string,
  cls: StudioClass,
  renew: boolean,
): string {
  return renew
    ? `Hi Vigorfit, this is ${who}. I'd like to renew my Classes subscription so I can join ${cls.name}.`
    : `Hi Vigorfit, this is ${who}. I'd like to enroll in the Classes subscription so I can join ${cls.name}.`;
}
