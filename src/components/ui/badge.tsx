import { cn } from "@/lib/utils";
import type { BookingStatus, Role } from "@/lib/types";

/*
  Status colours agree with the booking grid's slot states, so one vocabulary
  runs through the whole product: green means settled in your favour, red means
  it is not happening, and neutral means nobody has decided yet.

  `pending` and `completed` are both neutral, so they are separated by *shape*
  rather than hue — pending is an outline, because nothing has been settled;
  completed is a filled block, because it has. Relying on two different greys
  alone would have made them indistinguishable.
*/
const statusStyles: Record<BookingStatus, string> = {
  pending:
    "border border-ink-muted/40 text-ink-muted app-dark:border-sage-dim/50 app-dark:text-sage-dim",
  confirmed:
    "bg-forest/15 text-forest app-dark:bg-sage app-dark:text-ink",
  cancelled:
    "bg-oxblood/15 text-oxblood app-dark:bg-oxblood/25 app-dark:text-red-lift",
  completed:
    "bg-line-light text-ink app-dark:bg-panel-2 app-dark:text-bone",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        "app-dark:rounded-none app-dark:text-[10px] app-dark:font-semibold app-dark:uppercase app-dark:tracking-[0.1em]",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

/*
  Roles are not a severity scale, so they deliberately avoid the green/red
  vocabulary above — using it here would imply a coach is "good" and a client
  "cancelled". They separate by weight instead: admin carries the most ink,
  client the least.
*/
const roleStyles: Record<Role, string> = {
  // Heaviest: a solid block of ink.
  admin: "bg-ink text-paper app-dark:bg-bone app-dark:text-ink",
  // Middle: outlined, so it is clearly distinct from the `confirmed` status
  // badge, which owns the filled-green treatment.
  coach:
    "border border-ink/40 text-ink app-dark:border-bone/40 app-dark:text-bone",
  // Lightest: a quiet fill.
  client:
    "bg-line-light text-ink-muted app-dark:bg-panel-2 app-dark:text-sage-dim",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        "app-dark:rounded-none app-dark:text-[10px] app-dark:font-semibold app-dark:uppercase app-dark:tracking-[0.1em]",
        roleStyles[role],
      )}
    >
      {role}
    </span>
  );
}
