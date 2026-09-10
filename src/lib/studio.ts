/**
 * Public studio details for the marketing site: WhatsApp, address and hours.
 *
 * The WhatsApp number here is used for *click-to-chat* (user → business):
 * a `wa.me` deep link that opens WhatsApp with a pre-filled message. That is
 * deliberately separate from `src/lib/whatsapp.ts`, which is the Meta Cloud
 * API sender for business → user booking notifications and needs credentials
 * and approved templates. Click-to-chat needs neither.
 */

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

/** Hours are kept in studio time, whatever the visitor's own timezone. */
export const STUDIO_TIMEZONE = "Asia/Beirut";

type OpeningHours = {
  label: string;
  /** Date.getDay() numbering: 0 = Sunday … 6 = Saturday. */
  days: readonly number[];
  /** Minutes after midnight; null when closed all day. */
  hours: { open: number; close: number } | null;
};

/** The single source for the hours list and the live open/closed line. */
export const STUDIO_HOURS: readonly OpeningHours[] = [
  {
    label: "Mon – Fri",
    days: [1, 2, 3, 4, 5],
    hours: { open: 9 * 60, close: 17 * 60 },
  },
  { label: "Saturday", days: [6], hours: { open: 9 * 60, close: 14 * 60 } },
  { label: "Sunday", days: [0], hours: null },
];

/** "9am", "5pm", "5:30pm" from minutes after midnight. */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 || 12;
  return m
    ? `${hour}:${String(m).padStart(2, "0")}${suffix}`
    : `${hour}${suffix}`;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
    timeZone: STUDIO_TIMEZONE,
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
    return { open: true, text: `Open now until ${formatTime(today.close)}` };
  }
  if (today && minutes < today.open) {
    return { open: false, text: `Opens today at ${formatTime(today.open)}` };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = hoursOn((day + ahead) % 7);
    if (next) {
      const when = ahead === 1 ? "tomorrow" : WEEKDAYS[(day + ahead) % 7];
      return {
        open: false,
        text: `Closed, opens ${when} at ${formatTime(next.open)}`,
      };
    }
  }
  return { open: false, text: "Closed" };
}
