import type { Viewport } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/backend/auth";
import { getPublicCoaches } from "@/backend/public-coaches";
import { SESSION_LABEL } from "@/shared/booking";
import { buttonClasses, type Size } from "@/frontend/ui/button";
import { CoachAvatar } from "@/frontend/components/coach-avatar";
import { SiteNav } from "@/frontend/site/site-nav";
import { Reveal } from "@/frontend/site/reveal";
import { OpenStatus } from "@/frontend/site/open-status";
import { HeroObject } from "@/frontend/site/hero-object";
import { HERO_OBJECT } from "@/frontend/site/photos";
import { SiteFooter } from "@/frontend/site/site-footer";
import {
  STUDIO_ADDRESS,
  STUDIO_HOURS,
  STUDIO_MAPS_URL,
  STUDIO_WHATSAPP_DISPLAY,
  FREE_SESSION_GREETING,
  WHATSAPP_GREETING,
  formatClock,
  getOpenStatus,
  waLink,
} from "@/shared/studio";

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
    primaryGuest: "Claim your free session",
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

/*
  The hero ledger's one link — the same address, and the same treatment the
  footer gives it: bone, underlined, going sage on the hover phones never get,
  so the underline is what marks it as pressable.

  The rule colour is the difference. The footer underlines in `--line`, which
  is the hairline for the black well it sits in; on the hero's olive that is
  nearly invisible, so this uses `--rule` — exactly what the Contact band's
  address link uses on the same ground.
*/
const ledgerLink =
  "text-bone underline decoration-rule underline-offset-4 transition-colors hover:text-sage hover:decoration-sage";

/**
 * A booking button.
 *
 * Signed-in clients go to `href`. A visitor does not: they have no account
 * yet — the studio opens those — so their button opens WhatsApp with the
 * free-session request already written, which is genuinely the next step for
 * them rather than a login page they cannot get past.
 *
 * That guest branch used to point at `#contact`. It scrolled the whole page
 * down to a second button the visitor then had to find and press again, and
 * because an anchor stops wherever the band happens to fall it never landed
 * squarely on anything. One press, one destination.
 */
function BookButton({
  isClient,
  href,
  label,
  size = "lg",
  className,
}: {
  isClient: boolean;
  /** Where a signed-in client goes. Guests always go to WhatsApp. */
  href: string;
  /** Overrides the default label, which differs by signed-in state. */
  label?: string;
  size?: Size;
  className?: string;
}) {
  const classes = buttonClasses("cta", size, className);
  const text =
    label ?? (isClient ? copy.hero.primary : copy.hero.primaryGuest);

  if (isClient) {
    return (
      <Link href={href} className={classes}>
        {text}
      </Link>
    );
  }
  return (
    <a
      href={waLink(FREE_SESSION_GREETING)}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {text}
    </a>
  );
}

// Phone browsers that tint their toolbars from theme-color get the page's
// olive instead of their default light bar.
export const viewport: Viewport = { themeColor: "#16281b" };

/**
 * One row of the hero's ledger: term on the left, value on the right, the gap
 * between them left open. All of the alignment comes from CSS (`.ledger-row`),
 * so the markup stays a plain definition list.
 *
 * The terms are burgundy rather than sage. Note this is the hero's ledger
 * only — the opening hours in the Contact band use `.ledger-row` directly and
 * keep their sage terms, so the red stays one band's device.
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
      <dt className="tag text-brick">{term}</dt>
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
  const whatsappHref = waLink(WHATSAPP_GREETING);

  /*
    The page is a stack of full-bleed bands, and the order of their grounds is
    the structure a reader feels before they read a word:

        olive   hero      — the brand's own colour, the object, the facts
        olive   team      — raised a step on --panel so it separates
        bone    booking   — the one light band; the process, and the room
        olive   contact   — back to the brand to close the argument
        black   closing   — the deepest well on the page under the last CTA
        black   footer    — continuous with it, parted by one hairline

    Each band sets its own ground and its own text colour via `.brand-dark`,
    `.brand-light` or `.brand-black`, so nothing inside a band needs to know
    which surface it is on.
  */
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

        {/* The weight. Behind the type on phones, in its own column from lg,
            and drifting against the scroll on both. */}
        <HeroObject
          src={HERO_OBJECT.src}
          width={HERO_OBJECT.width}
          height={HERO_OBJECT.height}
          style={{ ["--ho-y" as string]: "-2%" }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          {/*
            Ends before the hero object's column begins (`lg:left-[62%]`), so
            the two never overlap once a real render is dropped in.

            The width is 58%, not half: the display clamp sizes off the
            viewport (`6vw`), but this column is a fraction of it, and at
            exactly the `lg` breakpoint a 50% column left the second headline
            line 35px short of fitting — which stranded the "&" on its own
            line. 58% clears it at every width from 1024 up.
          */}
          <div className="lg:max-w-[58%] lg:pr-8">
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
              <LedgerRow term="Place">
                <a
                  href={STUDIO_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ledgerLink}
                >
                  {STUDIO_ADDRESS[0]}
                </a>
              </LedgerRow>
              <LedgerRow term="Today">
                <OpenStatus initial={getOpenStatus()} />
              </LedgerRow>
            </dl>

            <div
              className="load-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "430ms" }}
            >
              <BookButton
                isClient={isClient}
                href="/client/coaches"
                className="tag px-7"
              />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("hairline", "lg", "tag px-7")}
              >
                {copy.hero.secondary}
              </a>
            </div>
            {!isClient && (
              <p
                className="load-rise mt-4 text-xs text-brick/70"
                style={{ animationDelay: "480ms" }}
              >
                Already training with us?{" "}
                {/*
                  The sentence is held at 70% of the accent and the link at its
                  full strength, because once the whole line is one colour that
                  step is the only thing marking the link — a phone has no hover
                  to do it. Two weights of one token, where this used to spend
                  two tokens on the same distinction.
                */}
                <Link href="/login" className="text-brick hover:underline">
                  Log in
                </Link>
              </p>
            )}
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
              <BookButton
                isClient={isClient}
                href="/client/coaches"
                size="md"
                className="tag mt-6"
              />
            </div>
          ) : (
            /*
              One ruled block, not a row of separate cards: the grid's own
              1px gaps show the `bg-line` behind it, so the coaches are
              divided by hairlines rather than floated apart by whitespace.
              That is the same joinery the booking steps below use, and it is
              what keeps the page reading as a single ruled sheet.
            */
            <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c) => (
                <div
                  key={c.id}
                  className="flex h-full flex-col bg-ground p-6 transition-colors hover:bg-panel/60"
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

                  {/*
                    The card's own button, so a signed-in client lands on this
                    coach rather than back at the list. A visitor gets the same
                    WhatsApp chat every other booking button gives them — it
                    used to send them to /login, which is a door they have no
                    key to. The label stays "Book a session": the card above it
                    is already naming who the session is with.
                  */}
                  <div className="mt-auto pt-6">
                    <BookButton
                      isClient={isClient}
                      href={`/client/book/${c.id}`}
                      label={copy.hero.primary}
                      size="sm"
                      className="tag w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/*
        ── Booking ──────────────────────────────────────────

        The one light band. It carries the process, which is the right content
        to put on paper: the steps are a list of instructions, and instructions
        belong on a page rather than on a wall.

        Two rows, both full width — the argument, then the three steps beneath
        it. The first row used to be a 5/7 split against a photograph of the
        floor; the photograph was never supplied, and a band that is half empty
        reads worse than one that is simply narrower than the grid allows. The
        text holds its own measure, so running it full width costs nothing.
      */}
      <section
        id="booking"
        className="brand-light relative border-t border-line"
      >
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="flex flex-col px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
            <h2 className="display d-lg text-ink">{copy.booking.heading}</h2>
            <p className="measure mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
              {copy.booking.lead}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <BookButton
                isClient={isClient}
                href="/client/coaches"
                className="tag px-8"
              />
              <a
                href="#team"
                className={buttonClasses("hairline", "lg", "tag px-8")}
              >
                {copy.booking.browse}
              </a>
            </div>
          </Reveal>

          {/*
            The steps. A ruled strip in the same joinery as the team block:
            one border around the group, 1px gaps showing through as the
            dividing rules.
          */}
          <div className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
            <ol className="grid gap-px border border-line-light bg-line-light sm:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="bg-paper-panel">
                  <div className="flex h-full flex-col p-8">
                    {/*
                      The numerals are the band's red, and the one place on the
                      page where burgundy sits on paper rather than on olive —
                      6.86:1 against this ground, so unlike the site's other
                      reds these are as readable as they are loud.

                      The rule under each number is tinted to match. It is the
                      nearest this layout gets to the dashed connector on the
                      studio's reference sheet, without moving anything.
                    */}
                    <span className="display block text-[clamp(3rem,5.5vw,4.5rem)] leading-[0.8] text-oxblood">
                      {s.n}
                    </span>
                    <h3 className="display mt-7 border-t border-oxblood/30 pt-5 text-[clamp(1.25rem,2vw,1.625rem)] text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
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
                              : "tabular-nums text-brick"
                          }
                        >
                          {hours
                            ? `${formatClock(hours.open)} – ${formatClock(hours.close)}`
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

      {/*
        ── Closing CTA ──────────────────────────────────────

        Black, and the only band that is. The page has argued on olive and
        explained itself on paper; the last ask sits in the deepest well on
        the page so there is nothing else to look at.
      */}
      <section className="brand-black relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(80% 120% at 50% 120%, rgba(151,176,140,0.20), transparent 62%)",
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
            <BookButton
              isClient={isClient}
              href="/client/coaches"
              className="tag px-10"
            />
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
