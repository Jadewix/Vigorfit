"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** When true, only highlight on an exact path match. */
  exact?: boolean;
};

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "app-dark:rounded-none app-dark:text-xs app-dark:font-semibold app-dark:uppercase app-dark:tracking-[0.12em]",
              active
                ? "bg-emerald-50 text-emerald-700 app-dark:bg-crimson app-dark:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 app-dark:text-mist app-dark:hover:bg-surface-2 app-dark:hover:text-bone",
            )}
          >
            <span
              className={
                active
                  ? "text-emerald-600 app-dark:text-white"
                  : "text-slate-400 app-dark:text-mist"
              }
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
