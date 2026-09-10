import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SLOT_CAPACITY, isOpenOn, slotTimesFor } from "@/lib/booking";
import {
  utcToZonedTime,
  weekdayOf,
  zonedDayRange,
  zonedTimeToUtc,
} from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Hourly slots for a coach on a given date, based on the studio's opening
 * hours. Each slot holds up to SLOT_CAPACITY clients, so a slot is only
 * `taken` once it's full (or the viewer already booked it). Past slots are
 * omitted.
 *
 *   GET /api/coaches/<id>/slots?date=YYYY-MM-DD
 *   -> { closed: false, slots: [{ time, taken, mine, remaining }] }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> },
) {
  const { coachId } = await params;

  // The auth check and the bookings read are two separate round trips to
  // Supabase, and running them back to back was most of the wait before times
  // appeared. Nothing in the bookings query depends on the user — their id is
  // only used to mark their own slots below — so both go out together. The
  // responses are still resolved in the original order, so 401 wins over every
  // other outcome exactly as before.
  const supabase = await createClient();
  const userPromise = supabase.auth.getUser();

  // The date and its slot times are on the studio's clock. The server's own
  // clock is UTC on Workers, where local midnight or getHours() are hours off.
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const day = zonedDayRange(date);
  const weekday = day ? weekdayOf(date) : -1;
  const open = day != null && isOpenOn(weekday);

  // Only worth asking for bookings on a day the studio actually opens. The
  // rejection handler keeps a query we end up abandoning (the 401 below) from
  // surfacing as an unhandled rejection.
  const bookedPromise =
    day && open
      ? createAdminClient()
          .from("bookings")
          .select("starts_at, client_id")
          .eq("coach_id", coachId)
          .in("status", ["pending", "confirmed"])
          .gte("starts_at", day.start.toISOString())
          .lt("starts_at", day.end.toISOString())
          .then(
            (r) => r.data ?? [],
            () => [],
          )
      : null;

  const {
    data: { user },
  } = await userPromise;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!day) {
    return NextResponse.json({ slots: [], closed: false });
  }
  if (!open) {
    return NextResponse.json({ slots: [], closed: true });
  }

  const booked = bookedPromise ? await bookedPromise : [];

  // How many clients are in each slot, and whether the viewer is one of them.
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const b of booked) {
    const key = utcToZonedTime(b.starts_at).time;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (b.client_id === user.id) mine.add(key);
  }

  const now = Date.now();
  const slots = slotTimesFor(weekday)
    .filter((t) => zonedTimeToUtc(date, t)!.getTime() >= now)
    .map((t) => {
      const remaining = Math.max(0, SLOT_CAPACITY - (counts.get(t) ?? 0));
      return {
        time: t,
        remaining,
        mine: mine.has(t),
        taken: remaining === 0 || mine.has(t),
      };
    });

  return NextResponse.json({ slots, closed: false });
}
