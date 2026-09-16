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
  Every variant carries both surfaces: the bare utilities style the light
  paper dashboards, and the `app-dark:` ones take over on the dark olive
  (marketing, login, client booking).

  Note which colour does the work, and where. Green fills `primary`, which is
  every ordinary action inside the dashboards. Burgundy fills two variants:
  `cta`, the booking call to action on the marketing site and the coach list,
  and `danger`, which is destructive.

  Those two are the same oxblood, and that is only safe because they never
  share a screen — `cta` appears on the olive and bone bands a visitor sees,
  `danger` on the light paper an admin sees. The one screen where the older
  rule still binds is the booking form, which prints "red is full" under its
  slot grid: its submit button stays `primary` so that page keeps a single
  meaning for red.
*/
const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-[background,border-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest app-dark:focus-visible:ring-sage app-dark:focus-visible:ring-offset-ground disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // The primary action. Deep forest on paper; on the dark ground the fill
  // flips to sage with dark type, which is the only pairing bright enough to
  // read as a button against olive (8.27:1) without resorting to red.
  primary:
    "bg-forest text-paper hover:bg-forest/90 app-dark:bg-sage app-dark:text-ink app-dark:hover:bg-bone",
  /*
    The booking call to action.

    Unusually, the fill does NOT flip between surfaces the way `primary` does.
    Oxblood is 1.42:1 against the olive, so on the dark bands the button's own
    edge is close to invisible and it is the bone label at 9.41:1 that draws
    the shape — which is exactly how the studio's reference sheet works: the
    word is the button. On the bone band the same fill sits at 6.86:1 against
    the ground and the edge does its own work.
  */
  cta: "bg-oxblood text-bone hover:bg-oxblood/85 app-dark:bg-oxblood app-dark:text-bone app-dark:hover:bg-oxblood/80",
  secondary:
    "bg-ink text-paper hover:bg-ink/85 app-dark:bg-panel-2 app-dark:text-bone app-dark:hover:bg-panel",
  outline:
    "border border-line-light bg-paper-panel text-ink hover:bg-paper app-dark:border-line app-dark:bg-transparent app-dark:text-bone app-dark:hover:border-sage app-dark:hover:text-sage",
  ghost:
    "text-ink-muted hover:bg-paper-panel hover:text-ink app-dark:text-sage-dim app-dark:hover:bg-panel-2 app-dark:hover:text-bone",
  // Destructive. Oxblood reads well as a fill on both surfaces; as *text* on
  // the dark ground it would fail contrast, which is why the dark treatment
  // keeps the fill rather than inverting to a red outline.
  danger:
    "bg-oxblood text-paper hover:bg-oxblood/85 app-dark:bg-oxblood app-dark:text-bone app-dark:hover:bg-oxblood/80",
  // Quiet hairline control, for the secondary action beside a primary CTA.
  hairline:
    "border border-line-light bg-transparent text-ink hover:border-forest hover:text-forest app-dark:border-rule app-dark:text-bone app-dark:hover:border-sage app-dark:hover:text-sage",
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
