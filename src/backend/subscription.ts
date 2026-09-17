import { createAdminClient } from "@/backend/supabase/admin";
import {
  EXPIRY_REMINDER_DAYS,
  FREE_CHANGES_LIMIT,
  MONTHLY_SESSION_LIMIT,
  WEEKLY_SESSION_LIMIT,
  isPlan,
  isTrack,
  type Plan,
  type ScheduleTrack,
} from "@/shared/booking";
import {
  daysUntil,
  subscriptionMonthRange,
  zonedToday,
  zonedWeekRange,
} from "@/shared/timezone";
import type { Role } from "@/shared/types";

export type Subscription = {
  /**
   * false only when `supabase/subscriptions.sql` hasn't been run yet, so the
   * columns don't exist. Callers fall back to the pre-subscription rules
   * rather than locking every client out of booking.
   */
  configured: boolean;
  role: Role | null;
  plan: Plan | null;
  track: ScheduleTrack | null;
  /** The "paid until" date, or null if an admin hasn't set one. */
  endsOn: string | null;
  /** Whole days until `endsOn`; negative once it has passed. */
  daysLeft: number | null;
  /** Past the end date — booking is blocked until the studio renews it. */
  expired: boolean;
  /** Ending within EXPIRY_REMINDER_DAYS, and not expired yet. */
  expiringSoon: boolean;
};

/** Postgres: undefined_column. */
const MISSING_COLUMN = "42703";

/** Bookings that consume the allowance. Cancelled ones never count. */
const COUNTED_STATUSES = ["pending", "confirmed", "completed"];

const NOT_CONFIGURED: Subscription = {
  configured: false,
  role: null,
  plan: null,
  track: null,
  endsOn: null,
  daysLeft: null,
  expired: false,
  expiringSoon: false,
};

/**
 * Reads one account's subscription. Uses the service role because the booking
 * paths already do, and because it must work the same whether the reader is
 * the client themselves, their coach, or an admin.
 *
 * The two migrations are handled independently: if `subscription_ends_on`
 * doesn't exist yet (subscription-limits.sql not run), it retries without it
 * so the plan and track rules keep working rather than silently reverting.
 */
export async function getSubscription(profileId: string): Promise<Subscription> {
  const admin = createAdminClient();
  const withEnd = "role, plan, schedule_track, subscription_ends_on";
  const withoutEnd = "role, plan, schedule_track";

  let { data, error } = await admin
    .from("profiles")
    .select(withEnd)
    .eq("id", profileId)
    .single();

  if (error?.code === MISSING_COLUMN) {
    ({ data, error } = await admin
      .from("profiles")
      .select(withoutEnd)
      .eq("id", profileId)
      .single());
  }

  if (error) {
    // Neither set of columns exists — subscriptions aren't installed at all.
    if (error.code === MISSING_COLUMN) return NOT_CONFIGURED;
    // Anything else: report "configured, but no plan", which blocks booking.
    // A transient failure must not quietly grant a subscription.
    console.error("[subscription]", error.message);
    return { ...NOT_CONFIGURED, configured: true };
  }

  const row = data as Record<string, unknown> | null;
  const endsOn =
    typeof row?.subscription_ends_on === "string"
      ? row.subscription_ends_on
      : null;
  const daysLeft = endsOn ? daysUntil(endsOn, zonedToday()) : null;

  return {
    configured: true,
    role: (row?.role as Role) ?? null,
    plan: isPlan(row?.plan) ? row.plan : null,
    track: isTrack(row?.schedule_track) ? row.schedule_track : null,
    endsOn,
    daysLeft,
    expired: daysLeft !== null && daysLeft < 0,
    expiringSoon:
      daysLeft !== null && daysLeft >= 0 && daysLeft <= EXPIRY_REMINDER_DAYS,
  };
}

/**
 * Whether this client still has their free first session.
 *
 * Derived from the bookings themselves rather than a flag on the profile:
 * a free booking that is pending, confirmed or completed uses it up, and
 * cancelling gives it straight back with nothing to reset.
 */
export async function hasFreeSessionAvailable(
  clientId: string,
): Promise<boolean> {
  const { count, error } = await createAdminClient()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_free", true)
    .in("status", COUNTED_STATUSES);

  if (error) {
    // 42703 = free-first-session.sql hasn't been run, so a booking can't be
    // marked free. Withhold the trial rather than hand out unlimited ones.
    if (error.code === MISSING_COLUMN) return false;
    console.error("[free-session]", error.message);
    return false;
  }
  return (count ?? 0) === 0;
}

export type Allowance = {
  weekUsed: number;
  weekLimit: number;
  weekFull: boolean;
  monthUsed: number;
  monthLimit: number;
  monthFull: boolean;
};

const EMPTY_ALLOWANCE: Allowance = {
  weekUsed: 0,
  weekLimit: WEEKLY_SESSION_LIMIT,
  weekFull: false,
  monthUsed: 0,
  monthLimit: MONTHLY_SESSION_LIMIT,
  monthFull: false,
};

/**
 * How much of a client's allowance the given day falls under.
 *
 * Sessions are counted by when they happen (`starts_at`), not when they were
 * booked, and against two windows: the Monday-to-Sunday week containing
 * `date`, and the subscription month ending on their renewal date.
 */
export async function getAllowance(
  clientId: string,
  endsOn: string | null,
  date: string = zonedToday(),
): Promise<Allowance> {
  const week = zonedWeekRange(date);
  const month = subscriptionMonthRange(date, endsOn);
  if (!week || !month) return EMPTY_ALLOWANCE;

  const admin = createAdminClient();
  const countIn = (from: Date, to: Date) =>
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", COUNTED_STATUSES)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString());

  const [w, m] = await Promise.all([
    countIn(week.start, week.end),
    countIn(month.start, month.end),
  ]);

  if (w.error || m.error) {
    console.error("[allowance]", (w.error ?? m.error)?.message);
    return EMPTY_ALLOWANCE;
  }

  const weekUsed = w.count ?? 0;
  const monthUsed = m.count ?? 0;
  return {
    weekUsed,
    weekLimit: WEEKLY_SESSION_LIMIT,
    weekFull: weekUsed >= WEEKLY_SESSION_LIMIT,
    monthUsed,
    monthLimit: MONTHLY_SESSION_LIMIT,
    monthFull: monthUsed >= MONTHLY_SESSION_LIMIT,
  };
}

export type Changes = {
  /** Cancellations and reschedules the client has spent this month. */
  used: number;
  limit: number;
  /** How many are still free; 0 once every one is spent. */
  left: number;
  /** The next change falls outside the free allowance and is charged. */
  chargeable: boolean;
};

/**
 * How many of the month's free cancellations and reschedules a client has
 * used.
 *
 * Counted over the same subscription month the session allowance uses, and
 * by `cancelled_at` — when the change was made — rather than by `starts_at`.
 * Cancelling next month's session is a change made today, and the studio
 * charges for the act, not for the hour that was given back.
 *
 * Only the client's own cancellations count. A session the coach or the
 * studio dropped is `cancelled_by` someone else and must never come out of
 * the member's three; before `supabase/cancellation-policy.sql` has been run
 * the column does not exist, and the count comes back as nothing spent rather
 * than as every cancellation charged to the client.
 */
export async function getChanges(
  clientId: string,
  endsOn: string | null,
  date: string = zonedToday(),
): Promise<Changes> {
  const empty: Changes = {
    used: 0,
    limit: FREE_CHANGES_LIMIT,
    left: FREE_CHANGES_LIMIT,
    chargeable: false,
  };

  const month = subscriptionMonthRange(date, endsOn);
  if (!month) return empty;

  const { count, error } = await createAdminClient()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "cancelled")
    .eq("cancelled_by", clientId)
    .gte("cancelled_at", month.start.toISOString())
    .lt("cancelled_at", month.end.toISOString());

  if (error) {
    // 42703 = cancellation-policy.sql hasn't been run. Nothing is recorded to
    // count, so nobody is charged for a change the database cannot see.
    if (error.code !== MISSING_COLUMN) console.error("[changes]", error.message);
    return empty;
  }

  const used = count ?? 0;
  return {
    used,
    limit: FREE_CHANGES_LIMIT,
    left: Math.max(0, FREE_CHANGES_LIMIT - used),
    chargeable: used >= FREE_CHANGES_LIMIT,
  };
}
