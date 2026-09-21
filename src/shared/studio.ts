/**
 * Public studio details for the marketing site: WhatsApp, address and hours.
 *
 * The WhatsApp number here is used for *click-to-chat* (user → business):
 * a `wa.me` deep link that opens WhatsApp with a pre-filled message. That is
 * deliberately separate from `src/backend/whatsapp.ts`, which is the Meta Cloud
 * API sender for business → user booking notifications and needs credentials
 * and approved templates. Click-to-chat needs neither.
 */
import { HOURS } from "@/shared/booking";
import { APP_TIMEZONE } from "@/shared/timezone";

/**
 * Studio WhatsApp number in international format, digits only (no "+", spaces
 * or dashes). Set NEXT_PUBLIC_WHATSAPP_NUMBER to the studio's real number —
 * the fallback below is a placeholder and will not reach anyone.
 */
export const STUDIO_WHATSAPP = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "96170123456"
).replace(/\D/g, "");

/**
 * Groups a number the way Lebanese numbers are written: "+961 78 903 759"
 * (mobile) or "+961 6 123 456" (landline). Anything else stays "+digits".
 */
function formatPhone(digits: string): string {
  const local = digits.startsWith("961") ? digits.slice(3) : "";
  if (local.length === 8) {
    return `+961 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  if (local.length === 7) {
    return `+961 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4)}`;
  }
  return `+${digits}`;
}

/** Display form, e.g. "+961 78 903 759". */
export const STUDIO_WHATSAPP_DISPLAY = formatPhone(STUDIO_WHATSAPP);

/** Opening line pre-filled in every WhatsApp chat started from the site. */
export const WHATSAPP_GREETING =
  "Hi Vigorfit, I'd like to ask about memberships and coaching.";

/**
 * The line a signed-out visitor's "Book a session" button writes for them.
 *
 * They have no account yet — the studio opens those — so the button cannot
 * send them to a login page or a booking grid. It opens this chat instead,
 * and the message asks for both of the things that actually have to happen
 * next, the session and the account, in one sentence the studio can act on
 * without a reply.
 */
export const FREE_SESSION_GREETING =
  "Hi I would like to claim my free session can you set up my account for me?";

/**
 * Build a WhatsApp click-to-chat link that opens a chat with the studio and
 * pre-fills `text`. Works on mobile (app) and desktop (web/desktop client).
 */
export function waLink(text: string, number: string = STUDIO_WHATSAPP): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Studio address, one entry per display line. */
export const STUDIO_ADDRESS = ["Main Street, Zgharta", "North Lebanon"] as const;

/** Google Maps pin for the studio. */
export const STUDIO_MAPS_URL = "https://maps.app.goo.gl/jRUd9qNsvoPxmGBX9";

/* --------------------------------------------------------------- hours --- */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type OpeningHours = {
  label: string;
  /** Date.getDay() numbering: 0 = Sunday … 6 = Saturday. */
  days: readonly number[];
  /** Minutes after midnight; null when closed all day. */
  hours: { open: number; close: number } | null;
};

/** Two days keep the same hours (or are both closed). */
function sameHours(
  a: { first: number; last: number } | null,
  b: { first: number; last: number } | null,
): boolean {
  if (!a || !b) return !a && !b;
  return a.first === b.first && a.last === b.last;
}

/**
 * The hours list, built from `HOURS` in shared/booking — the same table the
 * booking grid sells slots from, so the site can never advertise hours the
 * calendar disagrees with.
 *
 * Consecutive days that share hours collapse into one row ("Mon – Fri"), and
 * the week is walked Monday-first because that is how an opening-hours sign
 * reads, even though the underlying numbering starts at Sunday.
 */
function buildHours(): OpeningHours[] {
  const rows: { days: number[]; hours: { first: number; last: number } | null }[] =
    [];

  for (const day of [1, 2, 3, 4, 5, 6, 0]) {
    const hours = HOURS[day] ?? null;
    const last = rows[rows.length - 1];
    if (last && sameHours(last.hours, hours)) last.days.push(day);
    else rows.push({ days: [day], hours });
  }

  return rows.map(({ days, hours }) => ({
    // A single day gets its full name; a run gets a short-form range.
    label:
      days.length === 1
        ? WEEKDAYS[days[0]]
        : `${SHORT_WEEKDAYS[days[0]]} – ${SHORT_WEEKDAYS[days[days.length - 1]]}`,
    days,
    hours: hours
      ? { open: hours.first * 60, close: hours.last * 60 }
      : null,
  }));
}

/** The hours list and the live open/closed line both read this. */
export const STUDIO_HOURS: readonly OpeningHours[] = buildHours();

/** "9am", "5pm", "5:30pm" from minutes after midnight. */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 || 12;
  return m
    ? `${hour}:${String(m).padStart(2, "0")}${suffix}`
    : `${hour}${suffix}`;
}

/**
 * The same rows in the longer form the signed-in dashboards use, e.g.
 * `{ days: "Mon – Fri", hours: "8:00 AM – 6:00 PM" }`. Presentation only —
 * the numbers still come from the one table above.
 */
export const STUDIO_HOURS_DISPLAY = STUDIO_HOURS.map(({ label, hours }) => ({
  days: label,
  hours: hours
    ? `${formatLongClock(hours.open)} – ${formatLongClock(hours.close)}`
    : "Closed",
}));

/** "8:00 AM", "6:00 PM" from minutes after midnight. */
function formatLongClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function hoursOn(day: number) {
  return STUDIO_HOURS.find((row) => row.days.includes(day))?.hours ?? null;
}

/**
 * Whether the studio is open at `now`, as a line of copy: "Open now until
 * 5pm", "Opens today at 9am" or "Closed, opens Monday at 9am". It reads the
 * wall clock in Beirut, so it's right for visitors anywhere and across DST.
 */
export function getOpenStatus(now: Date = new Date()): {
  open: boolean;
  text: string;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = WEEKDAYS.indexOf(part("weekday"));
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));

  const today = hoursOn(day);
  if (today && minutes >= today.open && minutes < today.close) {
    return { open: true, text: `Open now until ${formatClock(today.close)}` };
  }
  if (today && minutes < today.open) {
    return { open: false, text: `Opens today at ${formatClock(today.open)}` };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = hoursOn((day + ahead) % 7);
    if (next) {
      const when = ahead === 1 ? "tomorrow" : WEEKDAYS[(day + ahead) % 7];
      return {
        open: false,
        text: `Closed, opens ${when} at ${formatClock(next.open)}`,
      };
    }
  }
  return { open: false, text: "Closed" };
}
