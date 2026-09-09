import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "hairline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-[background,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-crimson disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Flat scarlet block, per the reference's hard-edged CTA.
  primary: "bg-crimson text-white hover:bg-crimson-lift",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  // Hairline control for dark brand surfaces.
  hairline:
    "border border-rule bg-white/0 text-bone hover:border-crimson hover:text-crimson",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
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
