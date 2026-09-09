"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { RoleBadge } from "@/components/ui/badge";
import { BoltIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { signOutAction } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

/**
 * Mobile / narrow-screen navigation. On < md screens the sidebar is hidden, so
 * this opens as an off-canvas drawer sliding in from the right (the pattern
 * Shopify admin uses) rather than pushing the page down.
 *
 * The panel stays mounted and is moved with translate-x so it can animate both
 * ways; when closed it is pulled off-screen and made inert to pointers and
 * assistive tech.
 */
export function MobileNav({
  profile,
  navItems,
}: {
  profile: Profile;
  navItems: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: Escape closes, the page behind doesn't scroll, and focus moves
  // into the drawer.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const initials = (profile.full_name || profile.username || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const itemClass =
    "block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 app-dark:rounded-none app-dark:text-mist app-dark:hover:bg-surface-2 app-dark:hover:text-bone";

  return (
    <div className="md:hidden">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 app-dark:border-rule app-dark:bg-ink">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white app-dark:rounded-none app-dark:bg-crimson">
            <BoltIcon width={16} height={16} />
          </span>
          <span className="font-bold text-slate-900 app-dark:font-display app-dark:text-lg app-dark:font-normal app-dark:uppercase app-dark:text-bone">
            Vigorfit
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 app-dark:rounded-none app-dark:text-bone app-dark:hover:bg-surface-2"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Scrim */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300 app-dark:bg-black/70",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-xs flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out",
          "app-dark:border-line app-dark:bg-surface app-dark:shadow-none",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 app-dark:border-line">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 app-dark:text-mist">
            Menu
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 app-dark:rounded-none app-dark:text-bone app-dark:hover:bg-surface-2"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks items={navItems} />
        </div>

        <div className="border-t border-slate-200 p-3 app-dark:border-line">
          <div className="flex items-center gap-3 px-3 pb-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 app-dark:rounded-none app-dark:bg-crimson app-dark:text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 app-dark:text-bone">
                {profile.full_name || profile.username || "Unnamed"}
              </p>
              <RoleBadge role={profile.role} />
            </div>
          </div>

          <Link href="/account" className={itemClass}>
            Account
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={cn(itemClass, "w-full text-left")}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
