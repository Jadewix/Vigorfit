"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks, type NavItem } from "@/frontend/components/nav-links";
import { RoleBadge } from "@/frontend/ui/badge";
import { BoltIcon, CloseIcon, MenuIcon } from "@/frontend/components/icons";
import { signOutAction } from "@/app/login/actions";
import { cn, initialsOf } from "@/shared/utils";
import type { Profile } from "@/shared/types";

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

  const initials = initialsOf(profile.full_name || profile.username || "?");

  const itemClass =
    "block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink app-dark:rounded-none app-dark:text-sage-dim app-dark:hover:bg-panel-2 app-dark:hover:text-bone";

  return (
    <div className="md:hidden">
      {/*
        On the dark client surface this bar is dimensioned to match the public
        site's nav exactly — 64px tall, the mark in a cell closed by a hairline,
        and a flush sage block on the right holding the toggle — so a client
        arriving from the landing page sees the same bar, not a second one.
      */}
      <header className="flex items-center justify-between border-b border-line-light bg-paper-panel px-4 py-3 app-dark:h-16 app-dark:items-stretch app-dark:border-rule app-dark:bg-ground app-dark:p-0">
        <Link
          href="/"
          className="flex items-center gap-2 app-dark:border-r app-dark:border-rule app-dark:px-5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-paper app-dark:h-8 app-dark:w-8 app-dark:rounded-none app-dark:bg-sage app-dark:text-ink">
            <BoltIcon width={16} height={16} />
          </span>
          <span className="font-bold text-ink app-dark:font-display app-dark:text-xl app-dark:font-bold app-dark:uppercase app-dark:tracking-[-0.05em] app-dark:text-bone">
            Vigorfit
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-paper app-dark:h-auto app-dark:w-16 app-dark:rounded-none app-dark:bg-sage app-dark:text-ink app-dark:hover:bg-bone"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Scrim */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 app-dark:bg-black/70",
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
          "fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-xs flex-col border-l border-line-light bg-paper-panel shadow-2xl transition-transform duration-300 ease-out",
          "app-dark:border-line app-dark:bg-panel app-dark:shadow-none",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line-light px-4 py-3 app-dark:border-line">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted app-dark:text-sage-dim">
            Menu
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-paper app-dark:rounded-none app-dark:text-bone app-dark:hover:bg-panel-2"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks items={navItems} />
        </div>

        <div className="border-t border-line-light p-3 app-dark:border-line">
          <div className="flex items-center gap-3 px-3 pb-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-line-light text-sm font-semibold text-ink-muted app-dark:rounded-none app-dark:bg-sage app-dark:text-ink">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink app-dark:text-bone">
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
