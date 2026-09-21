import Link from "next/link";
import { cn } from "@/shared/utils";

export type FilterOption = {
  label: string;
  href: string;
  active: boolean;
  /** Matching row count, shown beside the label when provided. */
  count?: number;
};

/**
 * Row of filter links for a list page.
 *
 * These are `Link`s rather than buttons because the filter lives in the URL:
 * that is what lets a dashboard stat card point straight at a filtered view,
 * and it keeps the filtered list shareable and back-button friendly.
 *
 * Each chip is 44px tall on phones (Apple's minimum touch target) and tightens
 * to 36px from `sm`, where a pointer is doing the aiming.
 */
export function FilterChips({
  options,
  label,
}: {
  options: FilterOption[];
  /** Accessible name for the group, e.g. "Filter bookings". */
  label: string;
}) {
  return (
    <nav aria-label={label} className="mb-5 flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.active ? "page" : undefined}
          className={cn(
            "tag inline-flex h-11 items-center gap-2 rounded-lg px-4 transition-colors sm:h-9",
            "app-dark:rounded-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 app-dark:focus-visible:ring-sage app-dark:focus-visible:ring-offset-ground",
            o.active
              ? "border border-forest bg-forest text-paper app-dark:border-sage app-dark:bg-sage app-dark:text-ink"
              : "border border-line-light bg-paper-panel text-ink-muted hover:border-forest hover:text-forest-lift app-dark:border-line app-dark:bg-transparent app-dark:text-sage-dim app-dark:hover:border-sage app-dark:hover:text-sage-lift",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                "tabular-nums",
                o.active
                  ? "text-paper/70 app-dark:text-ink/60"
                  : "text-ink-muted/60 app-dark:text-sage-dim/60",
              )}
            >
              {o.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
