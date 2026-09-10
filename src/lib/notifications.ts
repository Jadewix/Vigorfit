/**
 * Booking notifications over WhatsApp. Every function is best-effort: it
 * swallows its own errors so a failed message never breaks a booking action.
 * Uses the admin (service-role) client so it can read phone numbers regardless
 * of the acting user's RLS scope.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { WA_TEMPLATES, sendWhatsAppTemplate } from "@/lib/whatsapp";
import { APP_TIMEZONE } from "@/lib/timezone";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

type Party = { name: string; phone: string | null };

async function loadParties(bookingId: string): Promise<{
  startsAt: string;
  client: Party;
  coach: Party;
} | null> {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("client_id, coach_id, starts_at")
    .eq("id", bookingId)
    .single();
  if (!booking) return null;

  const { data: profs } = await admin
    .from("profiles")
    .select("id, full_name, username, phone")
    .in("id", [booking.client_id, booking.coach_id]);

  const map = new Map((profs ?? []).map((p) => [p.id, p]));
  const c = map.get(booking.client_id);
  const co = map.get(booking.coach_id);

  return {
    startsAt: booking.starts_at,
    client: {
      name: c?.full_name || c?.username || "your client",
      phone: c?.phone ?? null,
    },
    coach: {
      name: co?.full_name || co?.username || "your coach",
      phone: co?.phone ?? null,
    },
  };
}

/** New request -> notify the coach. */
export async function notifyNewBooking(bookingId: string): Promise<void> {
  try {
    const p = await loadParties(bookingId);
    if (!p) return;
    await sendWhatsAppTemplate({
      to: p.coach.phone,
      template: WA_TEMPLATES.bookingRequest,
      params: [firstName(p.coach.name), p.client.name, formatWhen(p.startsAt)],
    });
  } catch (e) {
    console.error("[notify] notifyNewBooking", e);
  }
}

/**
 * Status change -> notify one side. `audience` is who receives it; `statusLabel`
 * is the human text shown in the message (e.g. "Confirmed", "Cancelled").
 */
export async function notifyBookingUpdate(
  bookingId: string,
  audience: "client" | "coach",
  statusLabel: string,
): Promise<void> {
  try {
    const p = await loadParties(bookingId);
    if (!p) return;
    const recipient = audience === "client" ? p.client : p.coach;
    const other = audience === "client" ? p.coach : p.client;
    await sendWhatsAppTemplate({
      to: recipient.phone,
      template: WA_TEMPLATES.bookingUpdate,
      params: [
        firstName(recipient.name),
        other.name,
        formatWhen(p.startsAt),
        statusLabel,
      ],
    });
  } catch (e) {
    console.error("[notify] notifyBookingUpdate", e);
  }
}

/** Upcoming session -> remind both client and coach. */
export async function notifyReminder(bookingId: string): Promise<void> {
  try {
    const p = await loadParties(bookingId);
    if (!p) return;
    const when = formatWhen(p.startsAt);
    await Promise.all([
      sendWhatsAppTemplate({
        to: p.client.phone,
        template: WA_TEMPLATES.sessionReminder,
        params: [firstName(p.client.name), p.coach.name, when],
      }),
      sendWhatsAppTemplate({
        to: p.coach.phone,
        template: WA_TEMPLATES.sessionReminder,
        params: [firstName(p.coach.name), p.client.name, when],
      }),
    ]);
  } catch (e) {
    console.error("[notify] notifyReminder", e);
  }
}
