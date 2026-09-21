import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/backend/supabase/server";
import { createAdminClient } from "@/backend/supabase/admin";
import {
  capacityFor,
  isOpenOn,
  slotAvailability,
  slotTimesFor,
} from "@/shared/booking";
import {
  getSubscription,
  hasFreeSessionAvailable,
} from "@/backend/subscription";
import { classesForCoachOn } from "@/backend/classes";
import { blockingClass } from "@/shared/classes";
import {
  utcToZonedTime,
  weekdayOf,
  zonedDayRange,
  zonedTimeToUtc,
} from "@/shared/timezone";

export const dynamic = "force-dynamic";

/**
 * Hourly slots for a coach on a given date, based on the studio's opening
 * hours. Each slot holds up to SLOT_CAPACITY clients, so a slot is only
 * `taken` once it's full (or the viewer already booked it). A slot that
 * overlaps one of the coach's classes is taken for everyone, with `inClass`
 * set. Past slots are omitted.
 *
 *   GET /api/coaches/<id>/slots?date=YYYY-MM-DD
 *   -> { closed: false, slots: [{ time, taken, mine, remaining, inClass }] }
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
          // `plan` may not exist yet (subscriptions.sql not run), and this
          // query is fired before we know, so take the whole row.
          .select("*")
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

  // The subscription decides both the capacity and which weekdays are on
  // offer. It needs the user id so it can't join the batch above, but it can
  // run alongside the bookings read.
  const [sub, booked, classes] = await Promise.all([
    getSubscription(user.id),
    bookedPromise ?? Promise.resolve([]),
    classesForCoachOn(coachId, date),
  ]);

  // Classes members join scheduled classes rather than booking coach hours.
  if (sub.plan === "classes") {
    return NextResponse.json({ slots: [], closed: false, classesOnly: true });
  }

  // A client with no subscription gets one free session; after that they
  // cannot book until an admin assigns a plan.
  const isTrial = sub.configured && sub.role === "client" && !sub.plan;
  if (isTrial && !(await hasFreeSessionAvailable(user.id))) {
    return NextResponse.json({ slots: [], closed: false, noPlan: true });
  }

  // An ended subscription blocks booking until the studio renews it.
  if (sub.expired) {
    return NextResponse.json({
      slots: [],
      closed: false,
      expired: true,
      endsOn: sub.endsOn,
    });
  }

  /*
    A day outside the member's schedule track used to return here with no
    slots and an `offTrack` flag. It no longer does: the track is a preference
    now, so every open day is served the same way and the booking form — which
    already knows the member's track from the page — draws the "preferably
    stick to your plan" note itself, with the date rather than a fetch later.
  */

  // Who is already in each slot, and whether the viewer is one of them.
  const occupants = new Map<string, { plan?: string | null }[]>();
  const mine = new Set<string>();
  for (const b of booked) {
    const key = utcToZonedTime(b.starts_at).time;
    const list = occupants.get(key) ?? [];
    list.push({ plan: b.plan ?? null });
    occupants.set(key, list);
    if (b.client_id === user.id) mine.add(key);
  }

  const now = Date.now();
  const slots = slotTimesFor(weekday)
    .filter((t) => zonedTimeToUtc(date, t)!.getTime() >= now)
    .map((t) => {
      // The coach is teaching a class then: nobody can have this hour.
      if (blockingClass(classes, date, t)) {
        return { time: t, remaining: 0, mine: false, taken: true, inClass: true };
      }
      const { remaining } = slotAvailability(
        (occupants.get(t) ?? []) as { plan?: null }[],
        sub.plan,
        { trial: isTrial },
      );
      return {
        time: t,
        remaining,
        mine: mine.has(t),
        taken: remaining === 0 || mine.has(t),
        inClass: false,
      };
    });

  return NextResponse.json({
    slots,
    closed: false,
    capacity: capacityFor(sub.plan),
  });
}
