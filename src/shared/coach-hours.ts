import { HOURS, type DayHours } from "@/shared/booking";
import { daysLabel, formatLongClock } from "@/shared/studio";

/** One line of an hours list: `{ days: "Monday", hours: "8:00 AM – 3:00 PM" }`. */
export type HoursRow = { days: string; hours: string };

/**
 * A coach's hours on one or more weekdays (Date.getDay() numbers): their own
 * hours, the studio's whole day ("full"), or a day off ("off").
 */
type Shift = { days: readonly number[]; hours: DayHours | "full" | "off" };

/**
 * Each coach's working hours. Clients can only book a coach on these days and
 * times, and the coach's booking page lists them as written here.
 *
 * Hours read like the studio's own: `{ first: 8, last: 15 }` shows as
 * "8:00 AM – 3:00 PM" and offers sessions starting from 8:00 AM up to
 * 3:00 PM. "full" is the studio's opening hours that day, and a day that
 * isn't listed is a day off.
 *
 * Coaches live in the database, so they're matched by first name. A coach
 * who isn't listed here can be booked whenever the studio is open.
 */
const COACH_HOURS: Record<string, readonly Shift[]> = {
  julie: [
    { days: [1], hours: { first: 8, last: 15 } },
    { days: [2], hours: "off" },
    { days: [3, 4], hours: { first: 15, last: 21 } },
    { days: [5], hours: "full" },
    { days: [6], hours: "full" },
  ],
  elie: [
    { days: [1], hours: { first: 15, last: 21 } },
    { days: [2], hours: "full" },
    { days: [3, 4], hours: { first: 8, last: 15 } },
    { days: [5], hours: "off" },
    { days: [6], hours: "off" },
  ],
};

/** The coach's shifts, or null when they keep the studio's hours. */
function shiftsFor(fullName: string | null | undefined): readonly Shift[] | null {
  // Their first name, so "Élie Ayoub" and "ELIE" both find "elie".
  const key = (fullName ?? "")
    .trim()
    .split(/\s+/)[0]
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return Object.hasOwn(COACH_HOURS, key) ? COACH_HOURS[key] : null;
}

/**
 * The hours a coach can be booked on a weekday, or null when they can't be
 * booked that day at all. Never wider than the studio's opening hours.
 */
export function coachHoursOn(
  fullName: string | null | undefined,
  weekday: number,
): DayHours | null {
  const studio = HOURS[weekday] ?? null;
  const shifts = shiftsFor(fullName);
  if (!shifts || !studio) return studio;

  const hours = shifts.find((s) => s.days.includes(weekday))?.hours ?? "off";
  if (hours === "off") return null;
  if (hours === "full") return studio;
  const first = Math.max(hours.first, studio.first);
  const last = Math.min(hours.last, studio.last);
  return first <= last ? { first, last } : null;
}

/** Weekdays the studio is open but the coach doesn't work. */
export function coachDaysOff(fullName: string | null | undefined): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter(
    (day) => HOURS[day] != null && !coachHoursOn(fullName, day),
  );
}

/** The coach's hours as their booking page lists them, or null when they keep the studio's. */
export function coachHoursDisplay(
  fullName: string | null | undefined,
): HoursRow[] | null {
  const shifts = shiftsFor(fullName);
  if (!shifts) return null;
  return shifts.map(({ days, hours }) => ({
    days: daysLabel(days),
    hours:
      hours === "off"
        ? "Off"
        : hours === "full"
          ? "Full day"
          : `${formatLongClock(hours.first * 60)} – ${formatLongClock(hours.last * 60)}`,
  }));
}
