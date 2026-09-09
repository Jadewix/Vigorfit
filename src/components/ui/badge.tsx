import { cn } from "@/lib/utils";
import type { BookingStatus, Role } from "@/lib/types";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 app-dark:bg-amber-400/15 app-dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 app-dark:bg-crimson app-dark:text-white",
  cancelled: "bg-red-100 text-red-700 app-dark:bg-line app-dark:text-mist",
  completed: "bg-slate-200 text-slate-700 app-dark:bg-surface-2 app-dark:text-bone",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        "app-dark:rounded-none app-dark:text-[10px] app-dark:font-semibold app-dark:uppercase app-dark:tracking-[0.14em]",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

const roleStyles: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-800 app-dark:bg-crimson/20 app-dark:text-crimson-lift",
  coach: "bg-sky-100 text-sky-800 app-dark:bg-line app-dark:text-bone",
  client: "bg-slate-200 text-slate-700 app-dark:bg-line app-dark:text-mist",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        "app-dark:rounded-none app-dark:text-[10px] app-dark:font-semibold app-dark:uppercase app-dark:tracking-[0.14em]",
        roleStyles[role],
      )}
    >
      {role}
    </span>
  );
}
