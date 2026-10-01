/** One line of an hours list: `{ days: "Monday", hours: "8:00 AM – 3:00 PM" }`. */
export type HoursRow = { days: string; hours: string };

/**
 * Each coach's own working hours, as their booking page lists them.
 *
 * Text only: the calendar still offers every slot in the studio's opening
 * hours (`HOURS` in shared/booking), so a day marked "Off" here can still be
 * booked. Coaches live in the database, so they're matched by first name.
 * A coach who isn't listed here gets the studio opening hours instead.
 */
const COACH_HOURS: Record<string, readonly HoursRow[]> = {
  julie: [
    { days: "Monday", hours: "8:00 AM – 3:00 PM" },
    { days: "Tuesday", hours: "Off" },
    { days: "Wed – Thu", hours: "3:00 PM – 9:00 PM" },
    { days: "Friday", hours: "Full day" },
    { days: "Saturday", hours: "Full day" },
  ],
  elie: [
    { days: "Monday", hours: "3:00 PM – 9:00 PM" },
    { days: "Tuesday", hours: "Full day" },
    { days: "Wed – Thu", hours: "8:00 AM – 3:00 PM" },
    { days: "Friday", hours: "Off" },
    { days: "Saturday", hours: "Off" },
  ],
};

/** The coach's own hours, or null when they keep the studio's. */
export function coachHoursFor(firstName: string): readonly HoursRow[] | null {
  // "Élie" and "ELIE" both find "elie".
  const key = firstName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return COACH_HOURS[key] ?? null;
}
