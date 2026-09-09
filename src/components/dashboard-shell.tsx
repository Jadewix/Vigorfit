import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { RoleBadge } from "@/components/ui/badge";
import { BoltIcon } from "@/components/icons";
import type { Profile } from "@/lib/types";

export function DashboardShell({
  profile,
  navItems,
  children,
  className,
}: {
  profile: Profile;
  navItems: NavItem[];
  children: React.ReactNode;
  /** Pass "app-dark" to run this shell on the dark brand (client booking flow). */
  className?: string;
}) {
  const initials = (profile.full_name || profile.username || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("flex min-h-screen bg-slate-50 app-dark:bg-ink", className)}>
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex app-dark:border-rule app-dark:bg-surface/40">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white app-dark:rounded-none app-dark:bg-crimson">
            <BoltIcon width={18} height={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 app-dark:font-display app-dark:text-xl app-dark:font-normal app-dark:uppercase app-dark:tracking-normal app-dark:text-bone">
            Vigorfit
          </span>
        </Link>

        <NavLinks items={navItems} />

        <div className="mt-auto border-t border-slate-200 pt-4 app-dark:border-line">
          <div className="flex items-center gap-3 px-2 pb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 app-dark:rounded-none app-dark:bg-crimson app-dark:text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 app-dark:text-bone">
                {profile.full_name || "Unnamed"}
              </p>
              <RoleBadge role={profile.role} />
            </div>
          </div>
          <Link
            href="/account"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 app-dark:rounded-none app-dark:text-mist app-dark:hover:bg-surface-2 app-dark:hover:text-bone"
          >
            Account
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar + menu */}
        <MobileNav profile={profile} navItems={navItems} />

        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

/** Consistent page heading used inside dashboards. */
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-heading text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 app-dark:mt-3 app-dark:max-w-lg app-dark:text-base app-dark:leading-relaxed app-dark:text-mist">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
