import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyReminder,
  notifySubscriptionExpiring,
} from "@/lib/notifications";
import { EXPIRY_REMINDER_DAYS } from "@/lib/booking";
import { shiftDate, zonedToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Sends WhatsApp reminders for confirmed sessions that start within the next
 * REMINDER_LEAD_MINUTES (default 24h) and haven't been reminded yet.
 *
 * Call it on a schedule (e.g. Vercel Cron or any external cron, hourly) with
 * the shared secret:
 *   GET /api/cron/reminders          Authorization: Bearer <CRON_SECRET>
 *   GET /api/cron/reminders?secret=<CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.nextUrl.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const leadMinutes = Number(process.env.REMINDER_LEAD_MINUTES || 1440);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + leadMinutes * 60_000);

  const admin = createAdminClient();
  const { data: due, error } = await admin
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const b of due ?? []) {
    await notifyReminder(b.id);
    await admin
      .from("bookings")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", b.id);
    sent++;
  }

  // --- subscriptions about to run out ------------------------------------
  // Sent once per period: the end date we warned about is stamped on the
  // profile, so bumping it on renewal re-arms the reminder by itself.
  let expiryReminders = 0;
  const today = zonedToday();
  const horizon = shiftDate(today, EXPIRY_REMINDER_DAYS);
  const { data: expiring, error: expErr } = await admin
    .from("profiles")
    .select("id, subscription_ends_on, subscription_reminder_sent_for")
    .eq("role", "client")
    .not("subscription_ends_on", "is", null)
    .gte("subscription_ends_on", today)
    .lte("subscription_ends_on", horizon ?? today);

  // 42703 = subscription-limits.sql hasn't been run; skip this half quietly.
  if (expErr && expErr.code !== "42703") {
    console.error("[cron] expiring lookup", expErr.message);
  }
  for (const c of expiring ?? []) {
    if (c.subscription_reminder_sent_for === c.subscription_ends_on) continue;
    // Only stamp a send that actually happened. A failed one (template not
    // approved yet, number not allow-listed, WhatsApp not configured) must
    // stay unstamped so the next run tries again.
    const delivered = await notifySubscriptionExpiring(c.id);
    if (!delivered) continue;
    await admin
      .from("profiles")
      .update({ subscription_reminder_sent_for: c.subscription_ends_on })
      .eq("id", c.id);
    expiryReminders++;
  }

  return NextResponse.json({ ok: true, sent, expiryReminders });
}
