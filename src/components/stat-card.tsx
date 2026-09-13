import Link from "next/link";
import { Card } from "@/components/ui/card";

/**
 * A dashboard figure. Given an `href` the whole card becomes a link to the
 * page that figure is about, so "Pending: 3" is a way in rather than a
 * dead end. It was duplicated in the admin and coach overviews before.
 */
export function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  /** Omit for a figure with nowhere useful to go. */
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="text-slate-400 transition-colors group-hover:text-crimson">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </>
  );

  if (!href) return <Card className="p-5">{body}</Card>;

  return (
    <Link
      href={href}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-crimson/40"
    >
      <Card className="p-5 transition-colors hover:border-crimson/60 hover:bg-crimson/[0.03]">
        {body}
      </Card>
    </Link>
  );
}
