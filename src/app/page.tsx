import type { Viewport } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/backend/auth";
import { getPublicCoaches } from "@/backend/public-coaches";
import { SESSION_LABEL } from "@/shared/booking";
import { buttonClasses, type Size } from "@/frontend/ui/button";
import { CoachAvatar } from "@/frontend/components/coach-avatar";
import { ClassMark, type ClassIcon } from "@/frontend/components/class-mark";
import { SiteNav } from "@/frontend/site/site-nav";
import { Reveal } from "@/frontend/site/reveal";
import { OpenStatus } from "@/frontend/site/open-status";
import { HeroMark } from "@/frontend/site/hero-mark";
import { HeroObject } from "@/frontend/site/hero-object";
import { HERO_OBJECT } from "@/frontend/site/photos";
import { SiteFooter } from "@/frontend/site/site-footer";
import { FeedbackForm } from "@/frontend/site/feedback-form";
import { sendFeedbackAction } from "./actions";
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
    // Two display lines: the first word at full size, the rest a step
    // below it. The no-break space keeps "&" on the line with "Classes", so a
    // phone that wraps the second line never strands it at the end of one.
    first: "Professional",
    rest: "Supervised Training &\u00A0Classes",
    lead: "Your progress is their job. Every program built, every session adjusted, every rep tracked. So all you have to do is show up and train.",
    primary: "Book a session",
    primaryGuest: "Claim your free session",
  },
  team: {
    heading: "The team",
    lead: "Your progress is their job. Every program built, every session adjusted, every rep tracked. So all you have to do is show up and train.",
    emptyTitle: "Coaches are being set up",
    emptyBody:
      "The studio is adding its coaches now. Check back soon to see who’s available.",
  },
  // Fixed for now. Each box is a name and an icon; to use a photo instead,
  // put a square image in public/ and add e.g. `photo: "/classes/yoga.jpg"`.
  // Icons: "lotus", "pullup", "dumbbell" (see ClassMark).
  classes: {
    heading: "Classes",
    items: [
      { name: "Yoga", icon: "lotus" },
      { name: "Calisthenics", icon: "pullup" },
      { name: "Weight Lifting", icon: "dumbbell" },
    ] as { name: string; icon: ClassIcon; photo?: string }[],
  },
  booking: {
    heading: "Booking",
    lead: "Your trainer, your time, your call. Booking shouldn’t take longer than the workout.",
    browse: "Browse the team",
  },
  contact: {
    heading: "Start a conversation",
    lead: "Questions about memberships or Trainers, feedback on the gym, or just a thought worth sharing. Contact us.",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Hours",
    cta: "Message us on WhatsApp",
  },
  // Read only by admin accounts — see supabase/feedback.sql.
  feedback: {
    title: "Feedback & Thoughts",
    to: "To Jad",
    note: "Goes straight to Jad, not to the coaches. Your name is optional.",
    message: "Your message",
    name: "Name (optional)",
    send: "Send",
    sending: "Sending…",
    sent: "Sent. Thank you.",
  },
  closing: {
    heading: "Book your session",
    lead: "One message gets you started. We’ll handle the rest.",
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
  "text-xl font-medium text-grey underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-sage hover:decoration-sage sm:text-2xl";

/*
  The hero ledger's one link — the same address, and the same treatment the
  footer gives it: grey, underlined, going sage on the hover phones never get,
  so the underline is what marks it as pressable.

  The rule colour is the difference. The footer underlines in `--line`, which
  is the hairline for the black well it sits in; on the hero's olive that is
  nearly invisible, so this uses `--rule` — exactly what the Contact band's
  address link uses on the same ground.
*/
const ledgerLink =
  "text-grey underline decoration-rule underline-offset-4 transition-colors hover:text-sage hover:decoration-sage";

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
 * The terms are sage. They spent a while in red — first wine, then the
 * accent — and at 3.19:1 on this ground they were the dimmest text in the
 * hero while also being the part that names what every figure beside them
 * means. Sage reads them at 6.58:1.
 *
 * Red has not left the hero: the mark in the bar above it, the booking
 * button and the sign-in line all still carry it. It is no longer doing the
 * one job it was worst at.
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
      <dt className="tag text-sage">{term}</dt>
      <dd className="text-grey">{children}</dd>
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

        olive   hero      — the brand's own colour, and the facts
        olive   team      — raised a step on --panel; the weight sits here
        olive   classes   — back down to the ground; the same cards as the team
        bone    booking   — the one light band; the process, and the room
        black   closing   — the deepest well on the page under the last CTA
        olive   contact   — the details, and the feedback box, after the ask
        black   footer    — parted from it by the burgundy hairline

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
        {/* Ground light. Low and off-centre, so the band is lit from one
            direction rather than evenly flooded. The weight it used to seat
            has moved down to the team band; the light stays, because what it
            is really doing is keeping a full screen of flat olive from
            reading as a blank. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(70% 55% at 78% 88%, rgba(151,176,140,0.14), transparent 64%), radial-gradient(55% 45% at 8% 4%, rgba(11,13,11,0.55), transparent 68%)",
          }}
        />

        {/* The mark in 3D, turning as the page scrolls. Behind the type on
            phones. From `lg` it takes the lower right of the band: the
            headline runs most of the way across, but the lead and the ledger
            under it stop short, and that corner is where the ground light
            above already falls. It is background, so the copy does not
            clear it, but it sits a little further right until `xl`: the
            lead's measure is fixed, and at 1024px it reaches 70% across. */}
        <HeroMark className="lg:left-[64%] lg:top-[22%] xl:left-[60%]" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12">
          {/*
            No width cap. This column used to stop at 58% so it cleared the
            weight's column beside it (`lg:left-[62%]`); with the weight now
            heading the team band there is nothing on the right to clear, and
            holding the hero to 58% left the other 42% of a full screen empty.

            Nothing here needs the cap to stay readable: the lead carries
            `.measure`, the ledger its own `max-w-md`, and the display lines
            size off the viewport with `clamp()` — which is also what the 58%
            was fighting, since a fraction of the viewport is not the viewport
            and the second line lost its "&" to a wrap at exactly `lg`.
          */}
          <div>
            {/*
              Two steps, not two equal lines. The first word takes the full
              display size and the rest sits a step below it: at one size the
              longer second line wraps, and two lines shouting at the same
              volume gave the hero no hierarchy to read. `text-balance` evens
              the second line out when a phone does wrap it.
            */}
            <h1 className="display">
              <span
                className="load-rise d-xl block text-grey"
                style={{ animationDelay: "60ms" }}
              >
                {copy.hero.first}
              </span>
              <span
                className="load-rise d-lg mt-1 block text-balance text-sage"
                style={{ animationDelay: "150ms" }}
              >
                {copy.hero.rest}
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

            {/*
              One button, not two. "Message on WhatsApp" sat beside the booking
              CTA here and went to the same chat the CTA already opens for a
              visitor — the first screen was asking twice for the same thing.
              WhatsApp is still the studio's only contact channel: it carries
              the Contact band's number and CTA, and the footer's row.
            */}
            <div
              className="load-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "430ms" }}
            >
              <BookButton
                isClient={isClient}
                href="/client/coaches"
                className="tag px-7"
              />
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
        className="relative bg-panel/30 px-5 pb-24 pt-16 sm:px-8 lg:pb-32 lg:pt-20"
      >
        <div className="mx-auto max-w-6xl">
          {/*
            The weight, moved down from the hero to head the coaches.

            It keeps both of its old treatments: behind the type at low
            opacity on phones, and in a column of its own beside the heading
            from `lg`. What it needs here that it did not need in the hero is
            a floor, or the weight would spill behind the first row of
            coaches, which are opaque and would cut it in half.

            Below `lg` the floor is sized to the weight itself, not to its
            file. The render is square but the dumbbell fills only the middle
            ~53% of its height; the rest is transparent. A floor sized to the
            full square left 70px of nothing above and below the heading on a
            phone. The weight is 84% of the column wide, so its visible height
            is about 45% of the viewport, and it stops growing at 16rem, when
            the box reaches its 30rem cap. On most phones the text is taller
            than that and sets the height itself.

            From `lg` the weight is at full strength, and so is its bloom, a
            soft disc as wide as the whole square. The floor there is the
            smallest one that keeps that disc inside the band, clear of the
            rule above and the coaches below.

            The band's top padding matches the gap below it to the coaches,
            so the block sits evenly between the rule above and the grid. The
            weight takes no vertical nudge: it is centred in the block.
          */}
          <div className="relative flex min-h-[min(45vw,16rem)] items-center lg:min-h-[18rem]">
            <HeroObject
              src={HERO_OBJECT.src}
              width={HERO_OBJECT.width}
              height={HERO_OBJECT.height}
              className="lg:left-[58%]"
            />

            <Reveal className="relative z-10 max-w-3xl lg:max-w-[54%]">
              <h2 className="display d-lg text-sage">{copy.team.heading}</h2>
              <p className="measure mt-5 text-base leading-relaxed text-sage-dim sm:text-lg">
                {copy.team.lead}
              </p>
            </Reveal>
          </div>

          {coaches.length === 0 ? (
            <div className="mt-16 border border-line bg-ground/60 p-10 text-center lg:mt-20">
              <p className="display d-md text-grey">{copy.team.emptyTitle}</p>
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
            <div className="mt-16 grid gap-px border border-line bg-line sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
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
                      <p className="display text-lg text-grey">{c.name}</p>
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
        ── Classes ──────────────────────────────────────────

        The team band's twin: the same heading, the same ruled block, the same
        square picture beside a name. What differs is the ground — down off
        --panel, so the two olive bands read as two sections rather than one
        long one — and that there is no button, since a class is booked the
        way everything else is, through a coach.

        The classes are written in `copy.classes.items` above.
      */}
      <section
        id="classes"
        className="relative border-t border-line px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-3xl">
            <h2 className="display d-lg text-sage">{copy.classes.heading}</h2>
          </Reveal>

          {/*
            The same hairline joinery as the team block, drawn a different
            way: each cell carries its own 1px ring, and neighbouring rings
            meet in the 1px gap as one rule. The team block lets `bg-line`
            show through its gaps instead, which also shows through an
            unfilled last row as a solid block; with rings, a short last
            row simply ends — as three boxes do on a two-column tablet.
          */}
          <ul className="mt-12 grid gap-px p-px sm:grid-cols-2 lg:grid-cols-3">
            {copy.classes.items.map((k) => (
              <li
                key={k.name}
                className="flex h-full flex-col bg-ground p-6 ring-1 ring-line transition-colors hover:bg-panel/60"
              >
                <div className="flex items-center gap-4">
                  <ClassMark
                    icon={k.icon}
                    photo={k.photo}
                    className="h-16 w-16"
                  />
                  <h3 className="display min-w-0 text-lg text-grey">
                    {k.name}
                  </h3>
                </div>
              </li>
            ))}
          </ul>
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

      {/*
        ── Closing CTA ──────────────────────────────────────

        Black, and the only band above the footer that is. The page has argued
        on olive and explained itself on paper; the ask sits in the deepest
        well on the page so there is nothing else to look at. The contact
        details come after it, for whoever still has a question.
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

      {/*
        ── Contact ──────────────────────────────────────────

        After the closing ask rather than before it. Two columns from `lg`:
        the studio's details on the left, and on the right the feedback box —
        the one thing on the page that is not addressed to the whole studio.
        On a phone the box follows the WhatsApp button.
      */}
      <section
        id="contact"
        className="relative border-t border-line px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <h2 className="display d-lg text-grey">{copy.contact.heading}</h2>
            <p className="measure mt-5 text-base leading-relaxed text-sage-dim sm:text-lg">
              {copy.contact.lead}
            </p>
          </Reveal>

          <div className="mt-10 grid gap-14 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <dl className="space-y-6 border-t border-rule pt-8">
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
                                ? "tabular-nums text-grey"
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

            {/*
              The feedback box. Its header is addressed like an envelope — what
              it is on the left, who it goes to on the right — in the same
              term-and-value split the ledgers use. Only admin accounts can read
              what arrives; nothing about the sender is kept but the name they
              choose to type.
            */}
            <Reveal delay={120}>
              <div className="border border-line bg-panel/40">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-6 py-5 sm:px-7">
                  <h3 className="display text-xl text-grey sm:text-2xl">
                    {copy.feedback.title}
                  </h3>
                  <p className="tag text-sage">{copy.feedback.to}</p>
                </div>
                <div className="px-6 py-6 sm:px-7">
                  <p className="mb-6 text-sm leading-relaxed text-sage-dim">
                    {copy.feedback.note}
                  </p>
                  <FeedbackForm action={sendFeedbackAction} copy={copy.feedback} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
