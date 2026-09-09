import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyReminder } from "@/lib/notifications";

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

  return NextResponse.json({ ok: true, sent });
}
