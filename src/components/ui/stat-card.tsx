import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/components/icons";

/*
  One stat card, shared by /coach and /admin — both pages previously carried
  their own identical copy of this component.

  Given an `href` it becomes a link to the records it counts, which is the
  point: a figure on a dashboard is a question ("which three are pending?")
  and the card is the answer to it. Without an `href` it degrades to a plain
  panel, so a stat with nowhere useful to go simply isn't pressable rather
  than being a link that lies.

  Touch behaviour follows Apple's HIG, since these are used on phones far
  more than on desktop:
    - the whole card is the target, not just the label (far past the 44pt
      minimum in both dimensions)
    - `active:` gives a real pressed state, so a tap is acknowledged
    - the chevron is the affordance that marks it as pressable at all; a card
      that merely changes colour on hover reads as decoration on a phone,
      where there is no hover
*/
type StatCardProps = {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  /** Where the figure's records live. Omit to render a non-interactive panel. */
  href?: string;
  /** Optional detail under the value, e.g. "3 this week". */
  hint?: string;
};

const shell =
  "rounded-xl border border-line-light bg-paper-panel p-5 app-dark:rounded-none app-dark:border-line app-dark:bg-panel/50";

export function StatCard({ label, value, icon, href, hint }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-muted app-dark:text-sage-dim">
          {label}
        </span>
        <span className="shrink-0 text-forest app-dark:text-sage">{icon}</span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="page-heading text-3xl tabular-nums text-ink app-dark:text-bone">
          {value}
        </p>
        {href && (
          <span
            aria-hidden
            className="mb-1 shrink-0 text-line-light transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-forest app-dark:text-line app-dark:group-hover:text-sage"
          >
            <ChevronRightIcon width={18} height={18} />
          </span>
        )}
      </div>

      {hint && (
        <p className="mt-1 text-xs text-ink-muted app-dark:text-sage-dim">
          {hint}
        </p>
      )}
    </>
  );

  if (!href) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        shell,
        "group block transition-colors",
        "hover:border-forest hover:bg-paper app-dark:hover:border-sage app-dark:hover:bg-panel",
        // Pressed state. On a phone this is the only feedback a tap gets.
        "active:scale-[0.99] active:bg-paper app-dark:active:bg-panel-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 app-dark:focus-visible:ring-sage app-dark:focus-visible:ring-offset-ground",
      )}
    >
      {body}
    </Link>
  );
}
