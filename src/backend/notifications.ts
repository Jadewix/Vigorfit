/**
 * Booking notifications over WhatsApp. Every function is best-effort: it
 * swallows its own errors so a failed message never breaks a booking action.
 * Uses the admin (service-role) client so it can read phone numbers regardless
 * of the acting user's RLS scope.
 */
import { createAdminClient } from "@/backend/supabase/admin";
import {
  WA_TEMPLATES,
  isWhatsAppConfigured,
  sendWhatsAppTemplate,
} from "@/backend/whatsapp";
import { PLANS, isPlan } from "@/shared/booking";
import { formatDateTime, formatInAppTimezone } from "@/shared/utils";

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
      params: [firstName(p.coach.name), p.client.name, formatDateTime(p.startsAt)],
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
        formatDateTime(p.startsAt),
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
    const when = formatDateTime(p.startsAt);
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

/** A "YYYY-MM-DD" date as e.g. "Sep 20", on the studio’s clock. */
function formatDay(date: string): string {
  // Midday avoids the date shifting either way across a timezone offset.
  return formatInAppTimezone(`${date}T12:00:00Z`, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Subscription about to run out -> notify the client.
 *
 * Returns whether a message actually reached WhatsApp. The caller stamps
 * the profile so the reminder goes out once per period, and stamping a
 * send that never happened would lose that period's warning for good.
 */
export async function notifySubscriptionExpiring(
  profileId: string,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data: p } = await admin
      .from("profiles")
      .select("full_name, username, phone, plan, subscription_ends_on")
      .eq("id", profileId)
      .single();
    if (!p || !p.subscription_ends_on) return false;

    const result = await sendWhatsAppTemplate({
      to: p.phone,
      template: WA_TEMPLATES.subscriptionExpiring,
      params: [
        firstName(p.full_name || p.username || "there"),
        isPlan(p.plan) ? PLANS[p.plan].label : "training",
        formatDay(p.subscription_ends_on),
      ],
    });

    // Dry-run reports ok even with no credentials, but nothing reached the
    // client, so it must not count as sent.
    return isWhatsAppConfigured() && result.ok;
  } catch (e) {
    console.error("[notify] notifySubscriptionExpiring", e);
    return false;
  }
}
