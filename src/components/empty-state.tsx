export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-light bg-paper-panel px-6 py-14 text-center app-dark:rounded-none app-dark:border-solid app-dark:border-line app-dark:bg-panel/40">
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink-muted app-dark:rounded-none app-dark:bg-line app-dark:text-sage">
          {icon}
        </span>
      )}
      <p className="panel-title font-medium text-ink">{title}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-sm text-ink-muted app-dark:mt-2 app-dark:text-sage-dim">
          {hint}
        </p>
      )}
    </div>
  );
}
