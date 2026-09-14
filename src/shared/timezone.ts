/**
 * Dates and times on the studio's clock.
 *
 * The studio is in Lebanon, so every time a person picks or reads (slots,
 * booking dates, WhatsApp messages) is Lebanon time, whatever clock the server
 * runs on. Cloudflare Workers always run in UTC, so anything that goes through
 * the server's local timezone — `new Date("2026-09-11T10:00:00")`, getHours(),
 * getDay(), toLocaleString() without a timeZone — is 2–3 hours off there.
 *
 * Beirut is UTC+3 in summer and UTC+2 once daylight saving ends, so offsets
 * always come from the zone's name through Intl, never a fixed "+03:00".
 */

const DEFAULT_TIMEZONE = "Asia/Beirut";

function resolveAppTimezone(): string {
  // This module reaches client bundles through utils.ts, and the browser has
  // no `process`; the default applies there.
  const configured =
    typeof process === "undefined" ? undefined : process.env.APP_TIMEZONE;
  if (!configured) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: configured });
    return configured;
  } catch {
    console.error(
      `[timezone] APP_TIMEZONE="${configured}" is not an IANA timezone; using ${DEFAULT_TIMEZONE}.`,
    );
    return DEFAULT_TIMEZONE;
  }
}

/** The studio's IANA timezone: APP_TIMEZONE if set, otherwise Lebanon. */
export const APP_TIMEZONE = resolveAppTimezone();

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" as [year, month, day]; null if malformed or not a real date. */
function parseDate(date: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // Date.UTC rolls 2026-02-30 over to March 2; a real date survives the trip.
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y &&
    t.getUTCMonth() === mo - 1 &&
    t.getUTCDate() === d
    ? [y, mo, d]
    : null;
}

/** "HH:MM" (24-hour) as [hour, minute]; null if malformed. */
function parseTime(time: string): [number, number] | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  return h < 24 && min < 60 ? [h, min] : null;
}

const clockFormatters = new Map<string, Intl.DateTimeFormat>();

/** What a wall clock in `timeZone` reads at `instant` (ms since the epoch). */
function wallClock(instant: number, timeZone: string) {
  let fmt = clockFormatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    clockFormatters.set(timeZone, fmt);
  }
  const n: Record<string, number> = {};
  for (const { type, value } of fmt.formatToParts(instant)) {
    if (type !== "literal") n[type] = Number(value);
  }
  return {
    year: n.year,
    month: n.month,
    day: n.day,
    hour: n.hour % 24, // some engines have written midnight as "24"
    minute: n.minute,
    second: n.second,
  };
}

/** How far `timeZone` runs ahead of UTC at `instant`, in ms. */
function offsetAt(instant: number, timeZone: string): number {
  const c = wallClock(instant, timeZone);
  const asUtc = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant at which the studio's clock reads `date` at `time`, or null if
 * either string is malformed. ("2026-09-11", "10:00") is 2026-09-11T07:00Z
 * (Beirut summer time, UTC+3); ("2026-11-02", "10:00") is 2026-11-02T08:00Z
 * (winter, UTC+2).
 *
 * On daylight-saving days it resolves times the way `new Date()` resolves a
 * local time: one the clocks pass twice gives the first, and one they skip
 * lands the same distance past the jump (00:30 → 01:30).
 */
export function zonedTimeToUtc(
  date: string,
  time: string,
  timeZone: string = APP_TIMEZONE,
): Date | null {
  const d = parseDate(date);
  const t = parseTime(time);
  if (!d || !t) return null;

  // The clock reading as if it were UTC. The instant is that minus the zone's
  // offset, but the offset depends on the instant, so try the offsets in force
  // a day either side (a zone changes offset at most once in that span) and
  // keep the first that reads back as this same clock time.
  const wall = Date.UTC(d[0], d[1] - 1, d[2], t[0], t[1]);
  const before = offsetAt(wall - DAY_MS, timeZone);
  const after = offsetAt(wall + DAY_MS, timeZone);
  for (const offset of [before, after]) {
    if (offsetAt(wall - offset, timeZone) === offset) {
      return new Date(wall - offset);
    }
  }
  // A time the clocks skipped: read it on the offset from before the jump.
  return new Date(wall - before);
}

/** The date ("YYYY-MM-DD") and time ("HH:MM") the studio's clock shows at `instant`. */
export function utcToZonedTime(
  instant: Date | string | number,
  timeZone: string = APP_TIMEZONE,
): { date: string; time: string } {
  const c = wallClock(new Date(instant).getTime(), timeZone);
  return {
    date: `${c.year}-${pad(c.month)}-${pad(c.day)}`,
    time: `${pad(c.hour)}:${pad(c.minute)}`,
  };
}

/** Today's date ("YYYY-MM-DD") on the studio's clock. */
export function zonedToday(timeZone: string = APP_TIMEZONE): string {
  return utcToZonedTime(Date.now(), timeZone).date;
}

/**
 * A studio day as [start, end) instants: midnight to the next midnight on its
 * clock. That's 23 or 25 hours on the days daylight saving starts or ends, so
 * never start + 24h. Null if `date` is malformed.
 */
export function zonedDayRange(
  date: string,
  timeZone: string = APP_TIMEZONE,
): { start: Date; end: Date } | null {
  const d = parseDate(date);
  if (!d) return null;
  const nextDay = new Date(Date.UTC(d[0], d[1] - 1, d[2] + 1))
    .toISOString()
    .slice(0, 10);
  return {
    start: zonedTimeToUtc(date, "00:00", timeZone)!,
    end: zonedTimeToUtc(nextDay, "00:00", timeZone)!,
  };
}

/** "YYYY-MM-DD" `days` later (negative goes back). Null if malformed. */
export function shiftDate(date: string, days: number): string | null {
  const d = parseDate(date);
  if (!d) return null;
  return new Date(Date.UTC(d[0], d[1] - 1, d[2] + days))
    .toISOString()
    .slice(0, 10);
}

/**
 * "YYYY-MM-DD" `months` later (negative goes back), clamped to the end of a
 * shorter month: Jan 31 minus one month is Dec 31, plus one is Feb 28/29.
 * Null if malformed.
 */
export function addMonths(date: string, months: number): string | null {
  const d = parseDate(date);
  if (!d) return null;
  const firstOfTarget = new Date(Date.UTC(d[0], d[1] - 1 + months, 1));
  const y = firstOfTarget.getUTCFullYear();
  const m = firstOfTarget.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d[2], lastDay)))
    .toISOString()
    .slice(0, 10);
}

/** Whole days from `from` to `date`; negative once `date` has passed. */
export function daysUntil(date: string, from: string): number | null {
  const a = parseDate(from);
  const b = parseDate(date);
  if (!a || !b) return null;
  const aMs = Date.UTC(a[0], a[1] - 1, a[2]);
  const bMs = Date.UTC(b[0], b[1] - 1, b[2]);
  return Math.round((bMs - aMs) / DAY_MS);
}

/**
 * The calendar week (Monday 00:00 up to the next Monday 00:00, studio clock)
 * containing `date`, as a half-open [start, end) instant range. Null if
 * `date` is malformed.
 */
export function zonedWeekRange(
  date: string,
  timeZone: string = APP_TIMEZONE,
): { start: Date; end: Date } | null {
  const weekday = weekdayOf(date); // 0 = Sunday
  if (weekday < 0) return null;
  // Sunday is the last day of the week here, so it counts back six days.
  const monday = shiftDate(date, -((weekday + 6) % 7));
  if (!monday) return null;
  const nextMonday = shiftDate(monday, 7)!;
  return {
    start: zonedTimeToUtc(monday, "00:00", timeZone)!,
    end: zonedTimeToUtc(nextMonday, "00:00", timeZone)!,
  };
}

/**
 * The subscription month a session on `date` falls in, as [start, end).
 *
 * With an end date it is the month ENDING on it (inclusive of that day), so
 * the allowance tracks the billing period rather than the calendar. Without
 * one it falls back to the calendar month, which is the best guess available.
 */
export function subscriptionMonthRange(
  date: string,
  endsOn: string | null,
  timeZone: string = APP_TIMEZONE,
): { start: Date; end: Date } | null {
  if (endsOn) {
    const periodStart = addMonths(endsOn, -1);
    const dayAfterEnd = shiftDate(endsOn, 1);
    if (!periodStart || !dayAfterEnd) return null;
    return {
      start: zonedTimeToUtc(periodStart, "00:00", timeZone)!,
      end: zonedTimeToUtc(dayAfterEnd, "00:00", timeZone)!,
    };
  }
  const d = parseDate(date);
  if (!d) return null;
  const first = `${d[0]}-${pad(d[1])}-01`;
  const nextFirst = new Date(Date.UTC(d[0], d[1], 1)).toISOString().slice(0, 10);
  return {
    start: zonedTimeToUtc(first, "00:00", timeZone)!,
    end: zonedTimeToUtc(nextFirst, "00:00", timeZone)!,
  };
}
/** Day of the week of a "YYYY-MM-DD" date (0 = Sunday); no clock changes it. -1 if malformed. */
export function weekdayOf(date: string): number {
  const d = parseDate(date);
  return d ? new Date(Date.UTC(d[0], d[1] - 1, d[2])).getUTCDay() : -1;
}
