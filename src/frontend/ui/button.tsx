import { cn } from "@/shared/utils";

export type Variant =
  | "primary"
  | "cta"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "hairline";
export type Size = "sm" | "md" | "lg";

/*
  Every variant carries both surfaces: the bare utilities style the paper
  dashboards, and the `app-dark:` ones take over on the pastel green
  (marketing, login, client booking).

  Note which colour does the work, and where. Green fills `primary`, which is
  every ordinary action inside the dashboards. Burgundy fills two variants:
  `cta`, the booking call to action on the marketing site and the coach list,
  and `danger`, which is destructive.

  Those two are the same oxblood, and that is only safe because they never
  share a screen — `cta` appears on the green and paper bands a visitor sees,
  `danger` on the light paper an admin sees. The one screen where the older
  rule still binds is the booking form, which prints "red is full" under its
  slot grid: its submit button stays `primary` so that page keeps a single
  meaning for red.
*/
const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-[background,border-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest app-dark:focus-visible:ring-sage app-dark:focus-visible:ring-offset-ground disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // The primary action. Deep forest on paper; on the pastel the fill is the
  // brand's deep sage with light type (5.47:1), and it deepens on hover rather
  // than lightening, which is what a pressable fill does on a light ground.
  primary:
    "bg-forest text-paper hover:bg-forest/90 app-dark:bg-sage app-dark:text-paper app-dark:hover:bg-sage-lift",
  /*
    The booking call to action.

    The fill does NOT flip between surfaces the way `primary` does: burgundy
    on every ground. Against the pastel it stands at 8.28:1, so the button's
    own edge draws its shape, and its light label reads at 9.37:1.
  */
  cta: "bg-oxblood text-paper hover:bg-oxblood/85 app-dark:bg-oxblood app-dark:text-paper app-dark:hover:bg-oxblood/80",
  secondary:
    "bg-ink text-paper hover:bg-ink/85 app-dark:bg-panel-2 app-dark:text-bone app-dark:hover:bg-panel",
  outline:
    "border border-line-light bg-paper-panel text-ink hover:bg-paper app-dark:border-line app-dark:bg-transparent app-dark:text-bone app-dark:hover:border-sage app-dark:hover:text-sage-lift",
  ghost:
    "text-ink-muted hover:bg-paper-panel hover:text-ink app-dark:text-sage-dim app-dark:hover:bg-panel-2 app-dark:hover:text-bone",
  // Destructive. Oxblood reads well as a fill on both surfaces, with the same
  // light label on each.
  danger:
    "bg-oxblood text-paper hover:bg-oxblood/85 app-dark:bg-oxblood app-dark:text-paper app-dark:hover:bg-oxblood/80",
  // Quiet hairline control, for the secondary action beside a primary CTA.
  hairline:
    "border border-line-light bg-transparent text-ink hover:border-forest hover:text-forest-lift app-dark:border-rule app-dark:text-bone app-dark:hover:border-sage app-dark:hover:text-sage-lift",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  // 48px: comfortably past the 44pt minimum touch target, since this is the
  // size the booking CTAs use on phones.
  lg: "h-12 px-6 text-base",
};

/** Compose the button class string (useful for styling <Link> as a button). */
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props} />
  );
}
