"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { signOutAction } from "@/app/login/actions";

const sections = [
  { id: "top", href: "#top", label: "Home" },
  { id: "team", href: "#team", label: "Team" },
  { id: "booking", href: "#booking", label: "Booking" },
];

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2.5"
      aria-label="Vigorfit home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-crimson font-display text-lg text-white">
        C
      </span>
      <span className="poster text-2xl text-bone">
        Vigorfit<span className="text-crimson">.</span>
      </span>
    </Link>
  );
}

export function SiteNav({ isClient }: { isClient: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");

  // Track which section is in view so the nav marks it, as in the reference.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-ink">
      <div className="flex h-16 items-stretch justify-between pl-5 sm:pl-8 lg:h-[72px]">
        <div className="flex items-center">
          <Wordmark onClick={close} />
        </div>

        <div className="flex items-stretch">
          {/* Desktop section links */}
          <nav className="hidden items-stretch md:flex">
            {sections.map((s) => (
              <a
                key={s.id}
                href={s.href}
                className={cn(
                  "label relative flex items-center px-6 transition-colors",
                  active === s.id
                    ? "text-crimson"
                    : "text-mist hover:text-bone",
                )}
              >
                {s.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-5 bottom-0 h-0.5 bg-crimson transition-opacity",
                    active === s.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </a>
            ))}
          </nav>

          {/* Signed-in controls keep the existing booking app reachable */}
          {isClient && (
            <div className="hidden items-center gap-5 pl-4 pr-6 md:flex">
              <Link
                href="/client/bookings"
                className="label text-mist transition-colors hover:text-bone"
              >
                My bookings
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="label text-mist transition-colors hover:text-bone"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}

          {/* Flush-right red block, per the reference */}
          <a
            href="#contact"
            className="label hidden items-center bg-crimson px-8 text-white transition-colors hover:bg-crimson-lift md:flex"
          >
            Contact us
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex w-16 items-center justify-center bg-crimson text-white md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 8h16M4 16h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 bg-ink transition-[opacity,transform] duration-300 md:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <nav className="flex flex-col px-5 py-4">
          {sections.map((s) => (
            <a
              key={s.id}
              href={s.href}
              onClick={close}
              className="poster border-b border-rule py-5 text-5xl text-bone"
            >
              {s.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={close}
            className="poster border-b border-rule py-5 text-5xl text-crimson"
          >
            Contact
          </a>

          <div className="mt-8 flex flex-col gap-3">
            {isClient ? (
              <>
                <Link
                  href="/client/coaches"
                  onClick={close}
                  className={buttonClasses("primary", "lg", "w-full")}
                >
                  Book a session
                </Link>
                <Link
                  href="/client/bookings"
                  onClick={close}
                  className={buttonClasses("hairline", "lg", "w-full")}
                >
                  My bookings
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className={buttonClasses("hairline", "lg", "w-full")}
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={close}
                  className={buttonClasses("primary", "lg", "w-full")}
                >
                  Book a session
                </Link>
                <Link
                  href="/login"
                  onClick={close}
                  className={buttonClasses("hairline", "lg", "w-full")}
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
