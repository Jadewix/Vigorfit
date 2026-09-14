import { APP_TIMEZONE } from "@/shared/timezone";

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Up to two uppercase initials for an avatar, e.g. "Casey Coach" -> "CC".
 *
 * `filter(Boolean)` is what keeps a name with a double space (or a leading
 * one) from producing an initial of `undefined`, which used to reach the
 * dashboard sidebar as a stray "U".
 */
export function initialsOf(name: string, fallback = "?"): string {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || fallback
  );
}

// Dates are shown on the studio's clock (APP_TIMEZONE), never the server's:
// toLocaleString() without a timeZone uses the server's own zone, which is UTC
// on Workers. The locale is pinned too, rather than left to the runtime, and
// matches the WhatsApp messages.
//
// Formatters are cached, since building one costs far more than using it and
// a booking list formats several dates per row.
const formatters = new Map<string, Intl.DateTimeFormat>();

/** Format an instant on the studio's clock, e.g. `{ weekday: "short" }` → "Fri". */
export function formatInAppTimezone(
  iso: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const key = JSON.stringify(options);
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: APP_TIMEZONE,
    });
    formatters.set(key, fmt);
  }
  return fmt.format(new Date(iso));
}

/** Format an ISO timestamp as e.g. "Mon, Sep 8, 9:00 AM" (studio time). */
export function formatDateTime(iso: string): string {
  return formatInAppTimezone(iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Format an ISO timestamp as just the time, e.g. "9:00 AM" (studio time). */
export function formatTime(iso: string): string {
  return formatInAppTimezone(iso, { hour: "numeric", minute: "2-digit" });
}
