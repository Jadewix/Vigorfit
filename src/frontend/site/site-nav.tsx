"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/shared/utils";
import { buttonClasses } from "@/frontend/ui/button";
import { signOutAction } from "@/app/login/actions";
import { Wordmark } from "@/frontend/site/wordmark";
import { FREE_SESSION_GREETING, waLink } from "@/shared/studio";

const sections = [
  { id: "top", href: "#top", label: "Home" },
  { id: "team", href: "#team", label: "Team" },
  { id: "classes", href: "#classes", label: "Classes" },
  { id: "booking", href: "#booking", label: "Booking" },
];

/**
 * The site's top bar, in three zones: the mark in its own ruled cell on the
 * left, the section index centred, and the actions flush to the right edge.
 *
 * The bar stays olive over every band, including the light one — it is the
 * frame the page scrolls inside rather than part of any section, and letting
 * it invert on the bone band would make it read as page content.
 */
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-ground">
      <div className="flex h-16 items-stretch lg:h-[72px]">
        {/*
          The mark sits in a cell of its own, closed by a hairline on its
          right. That rule is the whole difference between a logo floating in
          a bar and a bar that is divided into fields — the same joinery the
          bands below use.

          It earns that only from `md`, where the section index sits on the
          other side of it. Below that the index is hidden and the rule ends
          up dividing the mark from an empty spacer: a line with nothing on
          its far side, which is just a mark in the middle of the bar.
        */}
        <div className="flex items-center pl-5 pr-5 sm:pl-8 sm:pr-8 md:border-r md:border-rule">
          <Wordmark onClick={close} />
        </div>

        {/* Section index, centred between the mark and the actions. */}
        <nav className="hidden flex-1 items-stretch justify-center md:flex">
          {sections.map((s) => (
            <a
              key={s.id}
              href={s.href}
              aria-current={active === s.id ? "true" : undefined}
              className={cn(
                "tag relative flex items-center px-6 transition-colors",
                active === s.id ? "text-sage-lift" : "text-sage-dim hover:text-grey",
              )}
            >
              {s.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-5 bottom-0 h-0.5 bg-sage transition-opacity",
                  active === s.id ? "opacity-100" : "opacity-0",
                )}
              />
            </a>
          ))}
        </nav>

        {/* Spacer that keeps the actions right when the centre nav is hidden. */}
        <div className="flex-1 md:hidden" />

        <div className="flex items-stretch">
          {/*
            Log in, and the one action in this zone that a phone gets too.
            Everything else out here is desktop-only and folds into the drawer,
            but signing in is what a returning member opens the site to do, and
            it was two taps down behind a hamburger. It sits immediately before
            the burgundy block at the right edge — beside "Contact us" on a
            desktop, beside the menu button on a phone.

            Signed-in clients never see it: their own controls are in the block
            below, and the drawer carries them on a phone.
          */}
          {!isClient && (
            <Link
              href="/login"
              onClick={close}
              className="tag flex items-center whitespace-nowrap px-4 text-sage-dim transition-colors hover:text-grey sm:px-6"
            >
              Log in
            </Link>
          )}

          {/* Signed-in controls keep the existing booking app reachable */}
          {isClient && (
            <div className="hidden items-center gap-5 border-l border-rule px-6 md:flex">
              <Link
                href="/client/bookings"
                className="tag text-sage-dim transition-colors hover:text-grey"
              >
                My bookings
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="tag text-sage-dim transition-colors hover:text-grey"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}

          {/*
            Flush-right burgundy block, anchoring the nav to the right edge.
            The bar opens and closes on a red — which is how the studio's
            reference sheet balances its own top bar — though since the logo
            went in they are two different reds: the mark's own at the left
            edge, --oxblood at this one. They are far enough apart, at either
            end of a 1400px bar, not to be compared.
          */}
          <a
            href="#contact"
            className="tag hidden items-center bg-oxblood px-8 text-bone transition-colors hover:bg-oxblood/85 md:flex"
          >
            Contact us
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex w-16 items-center justify-center bg-oxblood text-bone md:hidden"
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
          "fixed inset-0 top-16 z-40 overflow-y-auto bg-ground transition-[opacity,transform] duration-300 md:hidden",
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
              className="display border-b border-rule py-5 text-4xl text-grey"
            >
              {s.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={close}
            className="display border-b border-rule py-5 text-4xl text-sage"
          >
            Contact
          </a>

          <div className="mt-8 flex flex-col gap-3 pb-8">
            {isClient ? (
              <>
                <Link
                  href="/client/coaches"
                  onClick={close}
                  className={buttonClasses("cta", "lg", "w-full")}
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
                {/*
                  Booking and logging in used to be two buttons to the same
                  page, which is not a choice. A visitor has no account yet, so
                  the booking one opens WhatsApp with the free-session request
                  written — the same thing every "Book a session" on the site
                  does for them — and only the second still goes to /login, for
                  the client who already has an account and is signed out.
                */}
                <a
                  href={waLink(FREE_SESSION_GREETING)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className={buttonClasses("cta", "lg", "w-full")}
                >
                  Book a session
                </a>
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
