import { StatusBadge } from "@/frontend/ui/badge";
import { CoachAvatar } from "@/frontend/components/coach-avatar";
import { formatInAppTimezone, formatTime } from "@/shared/utils";
import type { Booking } from "@/shared/types";

export function BookingList({
  items,
  getName,
  showClient = false,
  showCoach = false,
  getCoachPhoto,
  renderActions,
}: {
  items: Booking[];
  getName: (id: string) => string;
  showClient?: boolean;
  showCoach?: boolean;
  /** When given, the coach line carries their photo (or initials). */
  getCoachPhoto?: (coachId: string) => string | null;
  renderActions?: (booking: Booking) => React.ReactNode;
}) {
  return (
    <ul className="divide-y divide-line-light rounded-xl border border-line-light bg-paper-panel app-dark:divide-line app-dark:rounded-none app-dark:border-line app-dark:bg-panel/50">
      {items.map((b) => {
        return (
          <li key={b.id} className="flex items-start gap-3 p-3.5">
            {/* The chip already carries the date, so the line beside it leads
                with the time rather than repeating it and wrapping. */}
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-forest/10 text-forest-lift app-dark:rounded-none app-dark:bg-sage app-dark:text-ink">
              <span className="text-[10px] font-semibold uppercase leading-none">
                {formatInAppTimezone(b.starts_at, { month: "short" })}
              </span>
              <span className="text-base font-bold leading-tight">
                {formatInAppTimezone(b.starts_at, { day: "numeric" })}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              {/* Each time is kept unbreakable so a narrow column wraps
                  between them rather than splitting "11:00 AM". */}
              <p className="text-sm font-medium text-ink app-dark:text-bone">
                <span className="whitespace-nowrap">
                  {formatInAppTimezone(b.starts_at, { weekday: "short" })} ·{" "}
                  {formatTime(b.starts_at)} –
                </span>{" "}
                <span className="whitespace-nowrap">
                  {formatTime(b.ends_at)}
                </span>
              </p>

              {/* Coach and client each get their own line — sharing one line
                  meant the second name was always truncated away. */}
              <dl className="mt-1 space-y-0.5 text-xs">
                {showCoach && (
                  <div className="flex items-center gap-1.5">
                    <dt className="shrink-0 text-ink-muted app-dark:text-sage-dim/70">
                      Coach
                    </dt>
                    <dd className="flex min-w-0 items-center gap-1.5 text-ink-muted app-dark:text-sage-dim">
                      {getCoachPhoto && (
                        <CoachAvatar
                          name={getName(b.coach_id)}
                          photoUrl={getCoachPhoto(b.coach_id)}
                          className="h-5 w-5 text-[9px]"
                        />
                      )}
                      <span className="truncate">{getName(b.coach_id)}</span>
                    </dd>
                  </div>
                )}
                {showClient && (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted app-dark:text-sage-dim/70">
                      Client
                    </dt>
                    <dd className="truncate text-ink-muted app-dark:text-sage-dim">
                      {getName(b.client_id)}
                    </dd>
                  </div>
                )}
                {b.notes && (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted app-dark:text-sage-dim/70">
                      Notes
                    </dt>
                    <dd className="line-clamp-2 text-ink-muted app-dark:text-sage-dim">
                      {b.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge status={b.status} />
              {renderActions && renderActions(b)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
