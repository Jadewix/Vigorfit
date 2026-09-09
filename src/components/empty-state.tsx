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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center app-dark:rounded-none app-dark:border-solid app-dark:border-line app-dark:bg-surface/40">
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 app-dark:rounded-none app-dark:bg-line app-dark:text-crimson">
          {icon}
        </span>
      )}
      <p className="panel-title font-medium text-slate-900">{title}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 app-dark:mt-2 app-dark:text-mist">
          {hint}
        </p>
      )}
    </div>
  );
}
