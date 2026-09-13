import type { Viewport } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getPublicCoaches } from "@/lib/public-coaches";
import { SESSION_LABEL } from "@/lib/booking";
import { buttonClasses } from "@/components/ui/button";
import { CoachAvatar } from "@/components/coach-avatar";
import { SiteNav } from "@/components/site/site-nav";
import { Reveal } from "@/components/site/reveal";
import { OpenStatus } from "@/components/site/open-status";
import { HeroObject } from "@/components/site/hero-object";
import { SiteFooter } from "@/components/site/site-footer";
import {
  STUDIO_ADDRESS,
  STUDIO_HOURS,
  STUDIO_MAPS_URL,
  STUDIO_WHATSAPP_DISPLAY,
  WHATSAPP_GREETING,
  formatTime,
  getOpenStatus,
  waLink,
} from "@/lib/studio";

/*
  ─────────────────────────────────────────────────────────────
  ALL PAGE COPY LIVES HERE.

  Every word on the landing page is in this one object, so a rewrite is an
  edit to this block and nothing below it. Nothing in the layout measures
  itself against specific words: the display lines size themselves with
  `clamp()` rather than the per-line character math the previous Anton
  headline needed, so these strings can get longer or shorter freely.
  ─────────────────────────────────────────────────────────────
*/
const copy = {
  hero: {
    // Two display lines. The place name leads, because for a single-location
    // studio that is the most useful thing a visitor can read first.
    place: "Zgharta",
    trade: "Gym & Coaching",
    lead: "Train on your own with a membership, or book one-to-one sessions with a coach who programs for your goals.",
    primary: "Book a session",
    primaryGuest: "Log in to book",
    secondary: "Message on WhatsApp",
  },
  team: {
    heading: "The team",
    lead: "Senior coaches who stay. You train with the person who writes your program — every session.",
    emptyTitle: "Coaches are being set up",
    emptyBody:
      "The studio is adding its coaches now. Check back soon to see who’s available.",
  },
  booking: {
    heading: "Booking",
    lead: "Choose the coach who fits your goal, see when they’re free, and lock it in. Three steps, no back-and-forth.",
    browse: "Browse the team",
  },
  contact: {
    heading: "Start a conversation",
    lead: "Questions about memberships or coaching? Message us on WhatsApp.",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Hours",
    cta: "Message us on WhatsApp",
  },
  closing: {
    heading: "Book your session",
    lead: "Pick a coach, choose a time, and get to work. That’s the whole process.",
  },
} as const;

/*
  Numbered markers are usually decoration, but booking genuinely is a
  sequence — you cannot pick a time before you have picked a coach — so the
  numbers here carry real information about order.
*/
const steps = [
  {
    n: "01",
    title: "Choose your coach",
    body: "Read specialties and pick who fits your goal.",
  },
  {
    n: "02",
    title: "Pick a time",
    body: "See real availability and lock a slot that fits your week.",
  },
  {
    n: "03",
    title: "Show up and train",
    body: "Your coach has your program ready before you arrive.",
  },
];

// Contact details that open WhatsApp or Maps. The underline is what marks
// them as links on phones, where there's no hover.
const detailLink =
  "text-xl font-medium text-bone underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-sage hover:decoration-sage sm:text-2xl";

// Phone browsers that tint their toolbars from theme-color get the page's
// olive instead of their default light bar.
export const viewport: Viewport = { themeColor: "#16281b" };

/**
 * One row of the hero's ledger: term on the left, value on the right, leader
 * dots bridging the gap. The dots come from CSS (`.ledger-row > dt::after`),
 * so the markup stays a plain definition list.
 */
function LedgerRow({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ledger-row">
      <dt className="tag text-sage-dim">{term}</dt>
      <dd className="text-bone">{children}</dd>
    </div>
  );
}

export default async function Home() {
  // Coaches are public, so signed-out visitors see the team too. The cards
  // still route into the existing auth-gated booking flow untouched. The two
  // lookups are independent, so they run concurrently.
  const [profile, coaches] = await Promise.all([
    getCurrentProfile(),
    getPublicCoaches(),
  ]);
  const isClient = profile?.role === "client";
  const bookHref = isClient ? "/client/coaches" : "/login";
  const bookLabel = isClient ? copy.hero.primary : copy.hero.primaryGuest;
  const whatsappHref = waLink(WHATSAPP_GREETING);

  return (
    <div className="brand-dark relative flex min-h-screen flex-col overflow-x-hidden font-sans">
      <SiteNav isClient={isClient} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        id="top"
        className="grain relative flex min-h-[100svh] items-center overflow-hidden border-b border-rule pt-16 lg:pt-[72px]"
      >
        {/* Ground light. Low and off-centre, so the hero object below reads
            as lit from one direction rather than evenly flooded. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(70% 55% at 78% 88%, rgba(151,176,140,0.14), transparent 64%), radial-gradient(55% 45% at 8% 4%, rgba(11,13,11,0.55), transparent 68%)",
          }}
        />

        {/* The reserved layer for the 3D dumbbell. Sits behind the type at
            every size; see hero-object.tsx for how to drop the asset in. */}
        <HeroObject style={{ ["--ho-y" as string]: "-2%" }} />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          {/* Ends before the hero object's column begins (`lg:left-[53%]`),
              so the two never overlap once a real render is dropped in. */}
          <div className="lg:max-w-[50%] lg:pr-8">
            {/*
              Two steps, not two equal lines. The place name takes the full
              display size and the trade sits a step below it: at one size the
              longer second line wrapped and left a stranded "&", and two lines
              shouting at the same volume gave the hero no hierarchy to read.
            */}
            <h1 className="display">
              <span
                className="load-rise d-xl block text-bone"
                style={{ animationDelay: "60ms" }}
              >
                {copy.hero.place}
              </span>
              <span
                className="load-rise d-lg mt-1 block text-sage"
                style={{ animationDelay: "150ms" }}
              >
                {copy.hero.trade}
              </span>
            </h1>

            <p
              className="load-rise measure mt-7 text-base leading-relaxed text-sage-dim sm:text-lg"
              style={{ animationDelay: "250ms" }}
            >
              {copy.hero.lead}
            </p>

            {/* The ledger. A gym's facts are a short list of figures, so the
                hero states them as one rather than as prose or stat cards. */}
            <dl
              className="ledger load-rise mt-10 max-w-md text-sm"
              style={{ animationDelay: "340ms" }}
            >
              <LedgerRow term="Coaches">
                <span className="tabular-nums">{coaches.length}</span>
              </LedgerRow>
              <LedgerRow term="Session">{SESSION_LABEL}</LedgerRow>
              <LedgerRow term="Place">{STUDIO_ADDRESS[0]}</LedgerRow>
              <LedgerRow term="Today">
                <OpenStatus initial={getOpenStatus()} />
              </LedgerRow>
            </dl>

            <div
              className="load-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "430ms" }}
            >
              <Link
                href={bookHref}
                className={buttonClasses("primary", "lg", "tag px-7")}
              >
                {bookLabel}
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("hairline", "lg", "tag px-7")}
              >
                {copy.hero.secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────── */}
      <section
        id="team"
        className="relative bg-panel/30 px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-3xl">
            <h2 className="display d-lg text-sage">{copy.team.heading}</h2>
            <p className="measure mt-5 text-base leading-relaxed text-sage-dim sm:text-lg">
              {copy.team.lead}
            </p>
          </Reveal>

          {coaches.length === 0 ? (
            <div className="mt-12 border border-line bg-ground/60 p-10 text-center">
              <p className="display d-md text-bone">{copy.team.emptyTitle}</p>
              <p className="mx-auto mt-3 max-w-md text-sage-dim">
                {copy.team.emptyBody}
              </p>
              <Link
                href={bookHref}
                className={buttonClasses("primary", "md", "tag mt-6")}
              >
                {bookLabel}
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c) => (
                <div
                  key={c.id}
                  className="flex h-full flex-col border border-line bg-ground/50 p-6 transition-colors hover:border-sage"
                >
                  <div className="flex items-center gap-3.5">
                    <CoachAvatar
                      name={c.name}
                      photoUrl={c.photoUrl}
                      className="h-12 w-12 text-lg"
                    />
                    <div className="min-w-0">
                      <p className="display text-lg text-bone">{c.name}</p>
                      {c.specialty && (
                        <p className="tag text-sage">{c.specialty}</p>
                      )}
                    </div>
                  </div>

                  {c.bio && (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-sage-dim">
                      {c.bio}
                    </p>
                  )}

                  <div className="mt-auto pt-6">
                    <Link
                      href={isClient ? `/client/book/${c.id}` : "/login"}
                      className={buttonClasses("primary", "sm", "tag w-full")}
                    >
                      {copy.hero.primary}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Booking ────────────────────────────────────────── */}
      <section
        id="booking"
        className="relative border-t border-line px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-3xl">
            <h2 className="display d-lg text-sage">{copy.booking.heading}</h2>
            <p className="measure mt-5 text-base leading-relaxed text-sage-dim sm:text-lg">
              {copy.booking.lead}
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="bg-ground">
                <div className="flex h-full flex-col p-8 transition-colors hover:bg-panel/50">
                  <span className="display block text-[clamp(3rem,5.5vw,4.5rem)] leading-[0.8] text-sage">
                    {s.n}
                  </span>
                  <h3 className="display mt-7 border-t border-rule pt-5 text-[clamp(1.25rem,2vw,1.625rem)] text-bone">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-sage-dim">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={bookHref}
              className={buttonClasses("primary", "lg", "tag px-8")}
            >
              {bookLabel}
            </Link>
            <a
              href="#team"
              className={buttonClasses("hairline", "lg", "tag px-8")}
            >
              {copy.booking.browse}
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <section
        id="contact"
        className="relative border-t border-line px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <h2 className="display d-lg text-bone">{copy.contact.heading}</h2>
            <p className="measure mt-5 text-base leading-relaxed text-sage-dim sm:text-lg">
              {copy.contact.lead}
            </p>

            <dl className="mt-10 space-y-6 border-t border-rule pt-8">
              <div>
                <dt className="tag text-sage-dim">{copy.contact.whatsapp}</dt>
                <dd className="mt-1.5">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={detailLink}
                  >
                    {STUDIO_WHATSAPP_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="tag text-sage-dim">{copy.contact.address}</dt>
                <dd className="mt-1.5">
                  <a
                    href={STUDIO_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={detailLink}
                  >
                    {STUDIO_ADDRESS[0]}
                    <br />
                    {STUDIO_ADDRESS[1]}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="tag text-sage-dim">{copy.contact.hours}</dt>
                {/* The hours are the clearest case for the ledger: three
                    labels against three figures, aligned by the typeface. */}
                <dd className="mt-2">
                  <dl className="ledger max-w-sm text-base">
                    {STUDIO_HOURS.map(({ label, hours }) => (
                      <div key={label} className="ledger-row">
                        <dt className="text-sage-dim">{label}</dt>
                        <dd
                          className={
                            hours
                              ? "tabular-nums text-bone"
                              : "tabular-nums text-red-lift"
                          }
                        >
                          {hours
                            ? `${formatTime(hours.open)} – ${formatTime(hours.close)}`
                            : "Closed"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </dd>
              </div>
            </dl>

            <div className="mt-10">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("primary", "lg", "tag px-8")}
              >
                {copy.contact.cta}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-rule px-5 py-24 sm:px-8 lg:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(80% 120% at 50% 120%, rgba(151,176,140,0.16), transparent 62%)",
          }}
        />
        <Reveal className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="display text-[clamp(2.25rem,8vw,5.5rem)] text-sage">
            {copy.closing.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-sage-dim sm:text-lg">
            {copy.closing.lead}
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href={bookHref}
              className={buttonClasses("primary", "lg", "tag px-10")}
            >
              {bookLabel}
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
