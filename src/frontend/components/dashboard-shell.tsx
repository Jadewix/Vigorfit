import Link from "next/link";
import { Logo } from "@/frontend/components/logo";
import { cn, initialsOf } from "@/shared/utils";
import { NavLinks, type NavItem } from "@/frontend/components/nav-links";
import { MobileNav } from "@/frontend/components/mobile-nav";
import { SignOutButton } from "@/frontend/components/sign-out-button";
import { RoleBadge } from "@/frontend/ui/badge";
import type { Profile } from "@/shared/types";

/**
 * The signed-in chrome, on both surfaces.
 *
 * On the light paper dashboards (/coach, /admin) it stays as it was: a padded
 * sidebar of rounded rows. Inside the dark client area it takes the marketing
 * site's joinery instead — the sidebar becomes a column of ruled cells, and
 * its brand cell keeps the public nav's height, so moving from the landing
 * page into the booking flow does not feel like crossing into a different
 * product.
 *
 * The brand cell keeps that height but NOT the rule that closed it. On the
 * public nav that hairline divides the mark from the section index sitting
 * beside it, so it has something to divide. Here there is nothing on the far
 * side of it — the nav list below is already spaced away — so the rule only
 * drew a box around the logo, which is what the sidebar's own right edge was
 * already doing from the other side.
 */
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
  const initials = initialsOf(profile.full_name || profile.username || "?");

  return (
    <div
      className={cn("flex min-h-screen bg-paper app-dark:bg-ground", className)}
    >
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line-light bg-paper-panel p-4 md:flex app-dark:border-rule app-dark:bg-panel/40 app-dark:p-0">
        <Link
          href="/"
          className="mb-6 flex items-center px-2 app-dark:mb-0 app-dark:h-[72px] app-dark:px-5"
        >
          {/* The studio's logo, the same one the landing page opens with, so
              a client walking into the booking area meets the mark they just
              came from. /coach and /admin used to carry a green version of the
              placeholder — a different product to the person using them — but
              a logo is not a theme and there is only one of it. The letters
              take the surface's own text colour; the mark keeps its red. */}
          <Logo className="h-8 text-ink app-dark:h-9 app-dark:text-bone" />
        </Link>

        <div className="app-dark:flex-1 app-dark:p-3">
          <NavLinks items={navItems} />
        </div>

        <div className="mt-auto border-t border-line-light pt-4 app-dark:border-line app-dark:p-3 app-dark:pt-3">
          <div className="flex items-center gap-3 px-2 pb-2 app-dark:px-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-line-light text-sm font-semibold text-ink-muted app-dark:rounded-none app-dark:bg-sage app-dark:text-ink">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink app-dark:text-bone">
                {profile.full_name || "Unnamed"}
              </p>
              <RoleBadge role={profile.role} />
            </div>
          </div>
          <Link
            href="/account"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink app-dark:rounded-none app-dark:px-3 app-dark:py-2.5 app-dark:text-[0.6875rem] app-dark:font-semibold app-dark:uppercase app-dark:tracking-[0.1em] app-dark:text-sage-dim app-dark:hover:bg-panel-2 app-dark:hover:text-bone"
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 app-dark:mb-9 app-dark:border-b app-dark:border-rule app-dark:pb-6">
      <div>
        <h1 className="page-heading text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-muted app-dark:mt-3 app-dark:max-w-lg app-dark:text-base app-dark:leading-relaxed app-dark:text-sage-dim">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
