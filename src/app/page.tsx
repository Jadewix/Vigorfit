import type { Viewport } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getPublicCoaches } from "@/lib/public-coaches";
import { buttonClasses } from "@/components/ui/button";
import { CoachAvatar } from "@/components/coach-avatar";
import { SiteNav } from "@/components/site/site-nav";
import { Reveal } from "@/components/site/reveal";
import { OpenStatus } from "@/components/site/open-status";
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
// them as links on phones, where there's no hover. `.poster` sits outside
// Tailwind's layers, so its tight line-height needs `!` to be overridden —
// without the extra room the underline runs into the address's second line.
const detailLink =
  "poster text-2xl leading-[1.15]! text-bone underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-crimson hover:decoration-crimson";

// Phone browsers that tint their toolbars from theme-color get the page's
// black instead of their default light bar.
export const viewport: Viewport = { themeColor: "#0a0809" };

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
  const whatsappHref = waLink(WHATSAPP_GREETING);

  return (
    <div className="brand-dark relative flex min-h-screen flex-col overflow-x-hidden font-sans">
      <SiteNav isClient={isClient} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        id="top"
        className="grain relative flex min-h-[100svh] items-center overflow-hidden border-b border-rule pt-16 lg:pt-[72px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(75% 60% at 88% 92%, rgba(248,29,44,0.22), transparent 62%), radial-gradient(60% 50% at 10% 6%, rgba(122,15,28,0.30), transparent 65%)",
          }}
        />

        {/* Left rail — scroll cue, per the reference */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 border-r border-rule lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-5">
          <span className="vertical label text-crimson">Scroll down</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path
              d="M1 1l6 5 6-5"
              stroke="var(--crimson)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1500px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14 lg:py-20 lg:pl-24 lg:pr-10">
          {/* Poster headline. Each line is sized in container units so it runs
              the full column width at every screen size: 100 ÷ the line's
              rendered width in Anton ems (6.263 and 3.216), less 1% so
              rounding never overflows. */}
          <h1 className="poster @container text-crimson">
            <span
              className="load-rise block whitespace-nowrap text-[length:15.81cqw]"
              style={{ animationDelay: "60ms" }}
            >
              Gym & Coaching
            </span>{" "}
            <span
              className="load-rise block whitespace-nowrap text-[length:30.78cqw]"
              style={{ animationDelay: "160ms" }}
            >
              Zgharta
            </span>
          </h1>

          {/* Right column — statement, live opening hours, actions */}
          <div className="lg:pt-6">
            <p
              className="load-rise max-w-md text-lg leading-snug text-bone sm:text-xl"
              style={{ animationDelay: "260ms" }}
            >
              We&rsquo;re on Main Street. Train on your own with a membership,
              or book sessions with one of our coaches.
            </p>

            <OpenStatus
              initial={getOpenStatus()}
              className="load-rise mt-10 border-b border-rule pb-4"
              style={{ animationDelay: "340ms" }}
            />

            {/* Side by side only where the column is wide enough for both
                labels; the narrower desktop column stacks them like mobile. */}
            <div
              className="load-rise mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col"
              style={{ animationDelay: "420ms" }}
            >
              <Link
                href={bookHref}
                className={buttonClasses("primary", "lg", "label px-7")}
              >
                Book a session
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("hairline", "lg", "label px-7")}
              >
                Message us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────── */}
      <section
        id="team"
        className="relative bg-surface/30 px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-3xl">
            <h2 className="poster h-sec text-crimson">
              The team
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-mist">
              Senior coaches who stay. You train with the person who writes your
              program — every session.
            </p>
          </Reveal>

          {coaches.length === 0 ? (
            <div className="mt-12 border border-line bg-ink/60 p-10 text-center">
              <p className="poster text-3xl text-bone">
                Coaches are being set up
              </p>
              <p className="mx-auto mt-3 max-w-md text-mist">
                The studio is adding its coaches now. Check back soon to see
                who&rsquo;s available and book the moment they&rsquo;re live.
              </p>
              <Link
                href={bookHref}
                className={buttonClasses("primary", "md", "label mt-6")}
              >
                {isClient ? "Go to booking" : "Log in to book"}
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c, i) => {
                const name = c.name;
                return (
                  <Reveal key={c.id} delay={(i % 3) * 90}>
                    <div className="group flex h-full flex-col border border-line bg-ink/50 p-6 transition-colors hover:border-crimson">
                      <div className="flex items-center gap-3.5">
                        <CoachAvatar
                          name={name}
                          photoUrl={c.photoUrl}
                          className="h-12 w-12 text-lg"
                        />
                        <div>
                          <p className="poster text-xl text-bone">{name}</p>
                          {c.specialty && (
                            <p className="label text-crimson">{c.specialty}</p>
                          )}
                        </div>
                      </div>

                      {c.bio && (
                        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-mist">
                          {c.bio}
                        </p>
                      )}

                      <div className="mt-auto pt-6">
                        <Link
                          href={isClient ? `/client/book/${c.id}` : "/login"}
                          className={buttonClasses(
                            "primary",
                            "sm",
                            "label w-full",
                          )}
                        >
                          Book a session
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
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
            <h2 className="poster h-sec text-crimson">
              Booking
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-mist">
              Choose the coach who fits your goal, see when they&rsquo;re free,
              and lock it in. Three steps, no back-and-forth.
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="bg-ink">
                <div className="flex h-full flex-col p-8 transition-colors hover:bg-surface/50">
                  <span className="poster block text-[clamp(3.5rem,6vw,5.5rem)] leading-[0.8] text-crimson">
                    {s.n}
                  </span>
                  <h3 className="poster mt-7 border-t border-rule pt-5 text-[clamp(1.5rem,2.2vw,1.875rem)] text-bone">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={bookHref}
              className={buttonClasses("primary", "lg", "label px-8")}
            >
              {isClient ? "Book a session" : "Log in to book"}
            </Link>
            <a
              href="#team"
              className={buttonClasses("hairline", "lg", "label px-8")}
            >
              Browse the team
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <section
        id="contact"
        className="relative border-t border-line px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <h2 className="poster h-col text-bone">
              Start a conversation
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-mist">
              Questions about memberships or coaching? Message us on WhatsApp.
            </p>

            <dl className="mt-10 space-y-6 border-t border-rule pt-8">
              <div>
                <dt className="label text-mist">WhatsApp</dt>
                <dd className="mt-1">
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
                <dt className="label text-mist">Address</dt>
                <dd className="mt-1">
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
                <dt className="label text-mist">Hours</dt>
                <dd className="mt-1">
                  {/* Two columns so the times line up under each other. */}
                  <dl className="poster grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 text-2xl">
                    {STUDIO_HOURS.map(({ label, hours }) => (
                      <div key={label} className="contents">
                        <dt className="text-bone">{label}</dt>
                        <dd className={hours ? "text-bone" : "text-mist"}>
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
                className={buttonClasses("primary", "lg", "label px-8")}
              >
                Message us on WhatsApp
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
              "radial-gradient(80% 120% at 50% 120%, rgba(248,29,44,0.24), transparent 62%)",
          }}
        />
        <Reveal className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="poster text-[clamp(2.8rem,10vw,8rem)] text-crimson">
            Book your session
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-mist">
            Pick a coach, choose a time, and get to work. That&rsquo;s the whole
            process.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href={bookHref}
              className={buttonClasses("primary", "lg", "label px-10")}
            >
              {isClient ? "Book a session" : "Log in to book"}
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
