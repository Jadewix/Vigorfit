/** Every session is a fixed length (shown to users, not used to space slots). */
export const SESSION_MINUTES = 70; // 1 hour 10 minutes
export const SESSION_LABEL = "1 hour 10 minutes";

/** How many clients a coach can take in the same time slot. */
export const SLOT_CAPACITY = 2;

/**
 * Studio opening hours by weekday (0 = Sunday). Values are the first and last
 * bookable slot hour; slots run hourly on the hour. null = closed that day.
 */
const HOURS: Record<number, { first: number; last: number } | null> = {
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

/** Human-readable opening hours for display. */
export const STUDIO_HOURS_DISPLAY = [
  { days: "Monday – Friday", hours: "8:00 AM – 6:00 PM" },
  { days: "Saturday", hours: "8:00 AM – 3:00 PM" },
  { days: "Sunday", hours: "Closed" },
];
