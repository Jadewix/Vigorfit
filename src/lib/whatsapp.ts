/**
 * Meta WhatsApp Cloud API sender.
 *
 * Business-initiated messages must use pre-approved templates, so this sends
 * template messages. If credentials aren't configured yet, it runs in
 * "dry-run" mode and just logs — so the app works end-to-end before WhatsApp
 * is fully set up. See WHATSAPP.md for the templates to create.
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const DEFAULT_LANG = process.env.WHATSAPP_LANG || "en";

/** Template names — override via env if you name them differently in Meta. */
export const WA_TEMPLATES = {
  bookingRequest:
    process.env.WHATSAPP_TEMPLATE_BOOKING_REQUEST || "booking_request",
  bookingUpdate:
    process.env.WHATSAPP_TEMPLATE_BOOKING_UPDATE || "booking_update",
  sessionReminder:
    process.env.WHATSAPP_TEMPLATE_SESSION_REMINDER || "session_reminder",
  subscriptionExpiring:
    process.env.WHATSAPP_TEMPLATE_SUBSCRIPTION_EXPIRING ||
    "subscription_expiring",
};

export function isWhatsAppConfigured(): boolean {
  return Boolean(PHONE_ID && TOKEN);
}

/**
 * Convert a stored phone number to the digits-only form the Cloud API wants
 * (country code + number, no "+", spaces or dashes). Returns null if it
 * doesn't look like a usable number.
 */
export function toWaNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export async function sendWhatsAppTemplate(opts: {
  to: string | null | undefined;
  template: string;
  params: string[];
  lang?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = toWaNumber(opts.to);
  if (!to) return { ok: false, error: "invalid or missing phone number" };

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: opts.template,
      language: { code: opts.lang || DEFAULT_LANG },
      components: opts.params.length
        ? [
            {
              type: "body",
              parameters: opts.params.map((text) => ({ type: "text", text })),
            },
          ]
        : [],
    },
  };

  // Dry-run: no credentials yet -> log instead of sending.
  if (!isWhatsAppConfigured()) {
    console.log(
      `[whatsapp:dry-run] to=${to} template=${opts.template} params=${JSON.stringify(
        opts.params,
      )}`,
    );
    return { ok: true };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[whatsapp] send failed ${res.status}: ${body}`);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[whatsapp] send error", e);
    return { ok: false, error: String(e) };
  }
}
