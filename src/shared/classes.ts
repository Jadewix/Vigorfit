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
import { formatClock } from "@/shared/studio";
import { shiftDate, weekdayOf } from "@/shared/timezone";

export interface StudioClass {
  id: string;
  name: string;
  description: string | null;
  /** Public URL of the class's square photo in the class-photos bucket.
   *  Shown instead of the default icon when set; missing from the row until
   *  supabase/class-photos.sql runs. */
  photo_url?: string | null;
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

/* ------------------------------------------------------------- photos --- */

/**
 * The storage folder a photo uploaded by `uploaderId` lives in. The
 * class-photos bucket only lets each admin or coach write inside their own.
 */
export function classPhotoFolder(supabaseUrl: string, uploaderId: string): string {
  // Same shape as the URL getPublicUrl() returns; a trailing slash on the
  // configured project URL would otherwise make every photo fail the check.
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/class-photos/${uploaderId}/`;
}

/* ------------------------------------------------------------- timing --- */

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

/* ------------------------------------------------------ public page --- */

/** A one-off class whose day has gone. It no longer blocks or shows. */
export function isOver(cls: StudioClass, today: string): boolean {
  return !cls.repeats_weekly && cls.class_date < today;
}

/** Sorts like a timetable: weekly classes Monday to Sunday, then dates. */
function timetableKey(cls: StudioClass): string {
  return cls.repeats_weekly
    ? `0 ${(weekdayOf(cls.class_date) + 6) % 7} ${cls.start_time}`
    : `1 ${cls.class_date} ${cls.start_time}`;
}

/**
 * The classes the landing page shows, in the order it shows them: finished
 * one-offs dropped, the weekly timetable first, then one-off dates.
 */
export function publicTimetable(
  classes: StudioClass[],
  today: string,
): StudioClass[] {
  return classes
    .filter((c) => !isOver(c, today))
    .sort(
      (a, b) =>
        timetableKey(a).localeCompare(timetableKey(b)) ||
        a.name.localeCompare(b.name),
    );
}

/**
 * The landing page's shorter `whenLabel`: "Every Monday", "Every Monday from
 * 12 Oct" while a weekly class has yet to start, or "Saturday 3 Oct".
 */
export function shortWhenLabel(cls: StudioClass, today: string): string {
  if (!cls.repeats_weekly) return dateLabel(cls.class_date);
  const every = `Every ${WEEKDAYS[weekdayOf(cls.class_date)]}`;
  if (cls.class_date <= today) return every;
  const [, mo, d] = cls.class_date.split("-").map(Number);
  return `${every} from ${d} ${MONTHS[mo - 1]}`;
}

/** "6pm – 7pm", in the form the landing page writes its opening hours. */
export function shortTimeRangeLabel(cls: StudioClass): string {
  return `${formatClock(minutesOf(cls.start_time))} – ${formatClock(minutesOf(cls.end_time))}`;
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

/**
 * The next time a class meets from now: today if it hasn't started yet,
 * otherwise its next date. Null once a one-off class has started or passed.
 */
export function nextOccurrence(
  cls: StudioClass,
  today: string,
  nowTime: string,
): ClassOccurrence | null {
  const started = (date: string) =>
    date === today && shortTime(cls.start_time) <= nowTime;
  if (!cls.repeats_weekly) {
    return cls.class_date < today || started(cls.class_date)
      ? null
      : { date: cls.class_date, cls };
  }
  const from = cls.class_date > today ? cls.class_date : today;
  for (let i = 0; i < 8; i++) {
    const date = shiftDate(from, i)!;
    if (runsOn(cls, date) && !started(date)) return { date, cls };
  }
  return null;
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

/**
 * What a visitor without an account sends from the landing page. They can't
 * join yet, so it asks for both things that have to happen: the class and an
 * account (the studio opens those).
 */
export function guestJoinMessage({ date, cls }: ClassOccurrence): string {
  return `Hi Vigorfit, I'd like to join ${cls.name} on ${dateLabel(date)} at ${clockLabel(cls.start_time)}. Can you set up my account?`;
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
