import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { getCurrentProfile } from "@/backend/auth";
import { loadProfiles } from "@/backend/profile-names";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { EmptyState } from "@/frontend/components/empty-state";
import { ChevronRightIcon, WeekIcon } from "@/frontend/components/icons";
import {
  buildWeek,
  weekRangeLabel,
  weekdayName,
  type ScheduleWeek,
} from "@/shared/schedule";
import {
  shiftDate,
  weekStartOf,
  zonedToday,
  zonedWeekRange,
} from "@/shared/timezone";
import type { Booking } from "@/shared/types";
import { DayAgenda, WeekGrid } from "./week-view";

/*
  The coach's week.

  Everything here is one week wide, on purpose. The database is asked for
  exactly the week being shown rather than for the coach's whole history —
  which is what /coach, /coach/bookings and /coach/clients each do — so this
  page costs the same to open in year three as in week one, and paging
  backwards through a year is seven-day queries rather than a growing one.

  The week lives in the URL (`?week=YYYY-MM-DD`, any day inside it) so that
  last week is a link a coach can bookmark, share with the studio, or reach
  with the back button.
*/

const navButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line-light bg-paper-panel text-ink-muted transition-colors hover:border-forest hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";

/** One figure in the week's ledger strip. */
function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="bg-paper-panel p-3 sm:p-4">
      <dt className="tag text-ink-muted">{label}</dt>
      <dd className="page-heading mt-1 text-2xl tabular-nums text-ink">
        {value}
      </dd>
      <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

/** Plural that reads as English rather than as "1 session(s)". */
function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function summary(week: ScheduleWeek) {
  const activeDays = week.days.filter((d) => d.sessions > 0).length;
  const busiest = week.busiest;

  return [
    {
      label: "Sessions",
      value: week.sessions,
      hint:
        week.sessions === 0
          ? "nothing booked"
          : `across ${count(activeDays, "day")}`,
    },
    {
      label: "Clients",
      value: week.clients,
      hint: week.clients === 0 ? "none this week" : "training with you",
    },
    /*
      No "Pending" figure here. It had one, and it said the same thing as the
      call-out below — which is the version that can be pressed, and which
      correctly says nothing at all when there is nothing waiting. Two
      elements reporting one number cost a whole row on a phone, where the
      summary already pushed the first day of the week off the screen.
    */
    {
      label: "Busiest",
      // A week with no bookings has no busiest day, and "Mon 0" would be a
      // fact about nothing.
      value: busiest && busiest.sessions > 0
        ? weekdayName(busiest.date).slice(0, 3)
        : "—",
      hint:
        busiest && busiest.sessions > 0
          ? count(busiest.sessions, "session")
          : "no sessions yet",
    },
  ];
}

export default async function CoachSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const today = zonedToday();

  // The parameter is a date a person can type or edit, so anything that isn't
  // one simply lands on this week rather than erroring.
  const monday = weekStartOf(weekParam ?? "") ?? weekStartOf(today)!;
  const range = zonedWeekRange(monday)!;

  const supabase = await createClient();
  const me = await getCurrentProfile();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("coach_id", me!.id)
    .gte("starts_at", range.start.toISOString())
    .lt("starts_at", range.end.toISOString())
    .order("starts_at", { ascending: true });

  const bookings = (data ?? []) as Booking[];
  const profiles = await loadProfiles(
    supabase,
    bookings.map((b) => b.client_id),
  );
  const week = buildWeek(monday, bookings, (id) => ({
    name: profiles.get(id)?.name ?? "Unknown",
    phone: profiles.get(id)?.phone ?? null,
  }));

  const thisWeek = weekStartOf(today)!;
  const previous = shiftDate(monday, -7)!;
  const next = shiftDate(monday, 7)!;

  return (
    <>
      <PageHeading
        title="Weekly schedule"
        subtitle="Every session you are running this week, and who is in it."
        action={
          <Link
            href="/coach/bookings"
            className="tag text-forest transition-colors hover:text-ink"
          >
            All sessions →
          </Link>
        }
      />

      {/*
        Week navigation. The arrows are 44px so they are real targets on a
        phone, and "This week" only appears once it would actually do
        something — a button that returns you where you already are is a
        control you have to read before you can ignore it.
      */}
      <nav
        aria-label="Change week"
        className="mb-5 flex items-center justify-between gap-3"
      >
        <Link
          href={`/coach/schedule?week=${previous}`}
          aria-label="Previous week"
          className={navButton}
        >
          <ChevronRightIcon className="rotate-180" />
        </Link>

        <div className="min-w-0 text-center">
          <p className="panel-title truncate text-base text-ink">
            {weekRangeLabel(week.start, week.end)}
          </p>
          {monday === thisWeek ? (
            <p className="tag mt-0.5 text-forest">This week</p>
          ) : (
            <Link
              href="/coach/schedule"
              className="tag mt-0.5 inline-block text-ink-muted underline decoration-line-light underline-offset-4 transition-colors hover:text-forest"
            >
              Back to this week
            </Link>
          )}
        </div>

        <Link
          href={`/coach/schedule?week=${next}`}
          aria-label="Next week"
          className={navButton}
        >
          <ChevronRightIcon />
        </Link>
      </nav>

      {/*
        The week in three figures, ruled by the 1px gaps rather than by
        borders on each tile — the same joinery the landing page's step strip
        uses. It sits above the schedule because these are the answers a coach
        wants before they start reading hours.

        Three across at every width, including a phone. A 2x2 block was a
        second screenful of preamble before any actual session appeared, and
        the labels are short enough to survive a third of 375px.
      */}
      <dl className="mb-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line-light bg-line-light">
        {summary(week).map((figure) => (
          <Figure key={figure.label} {...figure} />
        ))}
      </dl>

      {/*
        Two call-outs, and only when there is something to say. Pending is the
        one thing on this page a coach has to act on, and the schedule is
        deliberately read-only — confirming lives on /coach/bookings, so there
        is one place where a session's status changes rather than two.
      */}
      {week.pending > 0 && (
        <Link
          href="/coach/bookings?status=pending"
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-forest/40 bg-forest/10 px-4 py-3 transition-colors hover:border-forest"
        >
          <span className="text-sm text-ink">
            <span className="font-semibold tabular-nums">{week.pending}</span>{" "}
            {week.pending === 1 ? "request is" : "requests are"} waiting on you.
          </span>
          <span className="tag shrink-0 whitespace-nowrap text-forest">
            Review →
          </span>
        </Link>
      )}

      {week.cancelled > 0 && (
        /*
          Cancelled sessions are counted but never drawn into the week — an
          hour nobody is coming to is not something the coach does, and
          leaving them in the grid would make a slot everyone dropped out of
          look full. The count keeps them from vanishing silently.
        */
        <Link
          href="/coach/bookings?status=cancelled"
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-line-light bg-paper-panel px-4 py-3 transition-colors hover:border-ink-muted"
        >
          {/* Phrased as a noun rather than a sentence, so one and many read
              the same way round: "1 cancelled session this week" needs no
              second agreement to get wrong. */}
          <span className="text-sm text-ink-muted">
            <span className="tabular-nums">{week.cancelled}</span>{" "}
            {week.cancelled === 1 ? "cancelled session" : "cancelled sessions"}{" "}
            this week, not shown below.
          </span>
          <span className="tag shrink-0 whitespace-nowrap text-ink-muted">
            See them →
          </span>
        </Link>
      )}

      {week.sessions === 0 ? (
        <EmptyState
          title="No sessions this week"
          hint="Nothing is booked between these dates. Use the arrows above to look at another week."
          icon={<WeekIcon />}
        />
      ) : (
        <>
          <DayAgenda week={week} today={today} />
          <WeekGrid week={week} today={today} />
        </>
      )}
    </>
  );
}
