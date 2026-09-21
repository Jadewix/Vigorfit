import { Fragment } from "react";
import { StatusBadge } from "@/frontend/ui/badge";
import { cn, formatTime } from "@/shared/utils";
import {
  dayLabel,
  dayNumber,
  hourLabel,
  planLabel,
  planShortLabel,
  weekdayName,
  type ScheduleDay,
  type ScheduleSlot,
  type ScheduleWeek,
} from "@/shared/schedule";
import type { BookingStatus } from "@/shared/types";

/*
  Two layouts over one model.

  A week grid is the right picture of a week and the wrong one for a 375px
  screen: six columns of names either wrap into noise or scroll sideways, and
  a schedule you have to drag around is not a schedule you check between sets.
  So phones get the agenda — the same week, read downwards, one day at a time,
  with every detail spelled out — and the grid appears at `lg`, where six
  columns have room to be columns.

  Neither is a fallback for the other. The agenda carries notes, numbers and
  statuses in full; the grid trades that for the shape of the week. Both are
  rendered from `ScheduleWeek`, so neither can quietly disagree with the
  figures at the top of the page.
*/

/* --------------------------------------------------------------- parts --- */

/*
  Status as a shape, not only a colour: filled for settled, hollow for
  waiting, faded for done. This is the same distinction StatusBadge draws —
  `pending` outlined because nothing has been decided, `completed` filled
  because it has — carried down to a 6px mark so a grid cell can say it
  without room for a word.
*/
const dotStyles: Record<BookingStatus, string> = {
  pending: "border-ink-muted/70",
  confirmed: "border-forest bg-forest",
  completed: "border-ink-muted/40 bg-ink-muted/40",
  // Unreachable: cancelled sessions are dropped before the model is built.
  // Present so the record stays exhaustive if that rule ever changes.
  cancelled: "border-oxblood bg-oxblood",
};

function StatusDot({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-2 w-2 shrink-0 rounded-full border",
        dotStyles[status],
        className,
      )}
    />
  );
}

/** "Semi-private · 3/4" — what the hour is, and how full it is. */
function SlotMeta({ slot }: { slot: ScheduleSlot }) {
  return (
    <span className="tag shrink-0 text-ink-muted">
      {planLabel(slot.plan)} ·{" "}
      <span className="tabular-nums">
        {slot.taken}/{slot.capacity}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------- agenda --- */

/**
 * One booked hour, in full: when it runs, what it is, and every client in it
 * with their number, their status and anything they wrote.
 */
function SlotRow({ slot }: { slot: ScheduleSlot }) {
  // A slot exists only because something is in it, so [0] is always there.
  // Everyone in an hour shares its start and end, so the first one speaks
  // for the slot.
  const { starts_at, ends_at } = slot.entries[0].booking;

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {/* Each time is unbreakable, so a narrow column wraps between them
            rather than splitting "10:10 AM" across two lines. */}
        <p className="text-sm font-semibold tabular-nums text-ink">
          <span className="whitespace-nowrap">{formatTime(starts_at)} –</span>{" "}
          <span className="whitespace-nowrap">{formatTime(ends_at)}</span>
        </p>
        <SlotMeta slot={slot} />
      </div>

      <ul className="mt-3 space-y-3">
        {slot.entries.map((entry) => (
          <li key={entry.booking.id} className="flex gap-2.5">
            <StatusDot status={entry.booking.status} className="mt-[7px]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium text-ink">
                  {entry.clientName}
                </span>
                <StatusBadge status={entry.booking.status} />
                {entry.booking.is_free && (
                  // Worth its own mark: a first session is someone the coach
                  // has never met, which changes how the hour is run.
                  <span className="tag rounded-full border border-forest/40 px-2 py-0.5 text-forest-lift">
                    First session
                  </span>
                )}
              </div>

              {entry.clientPhone && (
                /*
                  `tel:` rather than a WhatsApp deep link. Numbers are stored
                  as the studio typed them, so a local one would build a
                  wa.me link that silently opens nothing, while a dialler
                  takes any format — and this page is used on a phone.
                */
                <a
                  href={`tel:${entry.clientPhone}`}
                  className="mt-1 inline-block text-xs tabular-nums text-forest-lift underline decoration-forest/40 underline-offset-2 transition-colors hover:decoration-forest"
                >
                  {entry.clientPhone}
                </a>
              )}

              {entry.booking.notes && (
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  “{entry.booking.notes}”
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </li>
  );
}

function DayCard({ day, today }: { day: ScheduleDay; today: string }) {
  const isToday = day.date === today;

  return (
    <section className="overflow-hidden rounded-xl border border-line-light bg-paper-panel">
      <header
        className={cn(
          "flex items-baseline justify-between gap-3 border-b border-line-light px-4 py-3",
          isToday && "bg-forest/10",
        )}
      >
        <div className="min-w-0">
          <h3 className="panel-title text-base text-ink">
            {weekdayName(day.date)}
            {isToday && <span className="tag ml-2 text-forest-lift">Today</span>}
          </h3>
          <p className="mt-0.5 text-xs tabular-nums text-ink-muted">
            {dayLabel(day.date)}
          </p>
        </div>
        <span className="tag shrink-0 text-ink-muted">
          {day.sessions > 0
            ? `${day.sessions} booked`
            : day.open
              ? "Free"
              : "Closed"}
        </span>
      </header>

      {day.slots.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">
          {day.open ? "Nothing booked yet." : "The studio is closed."}
        </p>
      ) : (
        <ul className="divide-y divide-line-light">
          {day.slots.map((slot) => (
            <SlotRow key={slot.time} slot={slot} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** The phone layout: the week read downwards, one card per day. */
export function DayAgenda({
  week,
  today,
}: {
  week: ScheduleWeek;
  today: string;
}) {
  return (
    <div className="space-y-4 lg:hidden">
      {week.days.map((day) => (
        <DayCard key={day.date} day={day} today={today} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- grid --- */

/*
  Every cell carries the row's floor height itself rather than sitting inside
  a spacer. A grid item stretches to its row; a div nested in one does not,
  so a wrapper would leave each cell's colour floating in an unpainted row.
*/
const CELL = "min-h-[3.75rem]";

/** One cell of the week grid: a booked hour, a free one, or a closed one. */
function GridCell({ day, time }: { day: ScheduleDay; time: string }) {
  const slot = day.slots.find((s) => s.time === time);

  if (!slot) {
    /*
      Free and closed are different answers and are drawn differently: an
      hour the studio sells but nobody booked is empty canvas, an hour it does
      not sell at all is hatched. Saturday afternoon should look shut rather
      than available, and the two flat tones available here were too close to
      say that — see `.hours-closed` in globals.css.
    */
    return (
      <div
        className={cn(
          CELL,
          day.sells.includes(time) ? "bg-paper-panel" : "hours-closed",
        )}
      />
    );
  }

  const needsYou = slot.pending > 0;

  return (
    <div
      className={cn(
        CELL,
        "flex flex-col gap-1.5 border-l-2 p-2",
        // An hour with anything unconfirmed in it is drawn the way the
        // pending badge is — outlined and uncoloured, because nothing about
        // it is settled yet. A fully settled hour takes the forest fill.
        needsYou
          ? "border-ink-muted/60 bg-paper-panel"
          : "border-forest bg-forest/10",
      )}
    >
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="tag truncate text-ink">
          {planShortLabel(slot.plan)}
        </span>
        <span className="text-[11px] tabular-nums text-ink-muted">
          {slot.taken}/{slot.capacity}
        </span>
      </div>

      {/* Every name, not the first few: on this layout the grid is the only
          view a coach has, so a class of eight has to list eight. The row
          grows to fit and the rest of the week grows with it. */}
      <ul className="space-y-1">
        {slot.entries.map((entry) => (
          <li key={entry.booking.id} className="flex items-start gap-1.5">
            <StatusDot status={entry.booking.status} className="mt-[5px]" />
            {/* Wrapped, not truncated. A column is about 110px wide, which
                cuts most full names in half, and half a name is no use for
                telling two clients apart — the row grows instead. */}
            <span className="min-w-0 break-words text-xs leading-tight text-ink">
              {entry.clientName}
            </span>
          </li>
        ))}
      </ul>

      {needsYou && (
        // Plain small text rather than `.tag`: uppercase with the tag's
        // letter-spacing, "1 to confirm" broke across two lines in a column
        // this narrow.
        <span className="text-[10px] leading-tight text-ink-muted">
          <span className="tabular-nums">{slot.pending}</span> to confirm
        </span>
      )}
    </div>
  );
}

/**
 * The desktop layout: hours down the side, days across the top.
 *
 * One CSS grid holds the whole thing — the header row and every hour row —
 * so the columns line up by construction rather than by matching widths
 * between a header table and a body table. The 1px gaps show the background
 * through as the ruling, which is the same joinery the landing page's step
 * strip and coach grid use.
 */
export function WeekGrid({
  week,
  today,
}: {
  week: ScheduleWeek;
  today: string;
}) {
  return (
    <div className="hidden lg:block">
      <div
        className="grid gap-px overflow-hidden rounded-xl border border-line-light bg-line-light"
        style={{
          gridTemplateColumns: `4rem repeat(${week.days.length}, minmax(0, 1fr))`,
        }}
      >
        {/* The corner above the hour column. */}
        <div className="bg-paper-panel" />

        {week.days.map((day) => {
          const isToday = day.date === today;
          return (
            <div
              key={day.date}
              className={cn(
                "px-3 py-2.5 text-center",
                isToday ? "bg-forest/15" : "bg-paper-panel",
              )}
            >
              <p
                className={cn("tag", isToday ? "text-forest-lift" : "text-ink-muted")}
              >
                {weekdayName(day.date).slice(0, 3)}
              </p>
              <p
                className={cn(
                  "page-heading mt-0.5 text-xl tabular-nums",
                  isToday ? "text-forest-lift" : "text-ink",
                )}
              >
                {dayNumber(day.date)}
              </p>
            </div>
          );
        })}

        {week.hours.map((time) => (
          // The hour label and its day cells are siblings in the one grid, so
          // a fragment rather than a row wrapper — a wrapper would become a
          // grid item itself and collapse the row into a single column.
          <Fragment key={time}>
            <div className="flex items-start justify-end bg-paper-panel px-2 py-2">
              <span className="tag whitespace-nowrap tabular-nums text-ink-muted">
                {hourLabel(time)}
              </span>
            </div>
            {week.days.map((day) => (
              <GridCell key={day.date} day={day} time={time} />
            ))}
          </Fragment>
        ))}
      </div>

      {/* The marks are small enough to need naming once. */}
      <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        {(
          [
            ["confirmed", "Confirmed"],
            ["pending", "Waiting on you"],
            ["completed", "Done"],
          ] as const
        ).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <StatusDot status={status} />
            <dt className="sr-only">{status}</dt>
            <dd className="tag text-ink-muted">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
