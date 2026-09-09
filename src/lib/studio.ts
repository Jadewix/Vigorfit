/**
 * Public studio contact details for the marketing site.
 *
 * The WhatsApp number here is used for *click-to-chat* (user → business):
 * a `wa.me` deep link that opens WhatsApp with a pre-filled message. That is
 * deliberately separate from `src/lib/whatsapp.ts`, which is the Meta Cloud
 * API sender for business → user booking notifications and needs credentials
 * and approved templates. Click-to-chat needs neither.
 */

export const STUDIO_EMAIL = "hello@vigorfit.studio";

/**
 * Studio WhatsApp number in international format, digits only (no "+", spaces
 * or dashes). Set NEXT_PUBLIC_WHATSAPP_NUMBER to the studio's real number —
 * the fallback below is a placeholder and will not reach anyone.
 */
export const STUDIO_WHATSAPP = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "96170123456"
).replace(/\D/g, "");

/** Display form, e.g. "+96170123456". */
export const STUDIO_WHATSAPP_DISPLAY = `+${STUDIO_WHATSAPP}`;

/**
 * Build a WhatsApp click-to-chat link that opens a chat with the studio and
 * pre-fills `text`. Works on mobile (app) and desktop (web/desktop client).
 */
export function waLink(text: string, number: string = STUDIO_WHATSAPP): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
