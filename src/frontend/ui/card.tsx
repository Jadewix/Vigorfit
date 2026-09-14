import { cn } from "@/shared/utils";

/**
 * Panel surface. Soft and rounded on the light paper dashboards; hard-edged
 * on the dark olive, where the whole system is built from hairlines rather
 * than shadows.
 */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-light bg-paper-panel",
        "app-dark:rounded-none app-dark:border-line app-dark:bg-panel/50",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-0", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("panel-title text-base text-ink app-dark:text-bone", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
