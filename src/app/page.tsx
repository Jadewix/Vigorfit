import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonClasses } from "@/components/ui/button";
import { SiteNav } from "@/components/site/site-nav";
import { Reveal } from "@/components/site/reveal";
import { ContactForm, WhatsAppIcon } from "@/components/site/contact-form";
import { STUDIO_EMAIL, STUDIO_WHATSAPP_DISPLAY, waLink } from "@/lib/studio";
import type { Coach, Profile } from "@/lib/types";

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C"
  );
}

const stats = [
  { value: "11", unit: "yrs", label: "Coaching, one studio, no franchise" },
  { value: "480+", unit: "", label: "Athletes coached to their goal" },
  { value: "4.9", unit: "/5", label: "Average rating across sessions" },
];

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

export default async function Home() {
  const profile = await getCurrentProfile();
  const isClient = profile?.role === "client";
  const bookHref = isClient ? "/client/coaches" : "/login";

  // Surface real coaches from the booking system; the cards route into the
  // existing (auth-gated) booking flow untouched.
  const supabase = await createClient();
  const { data: coachesData } = await supabase
    .from("coaches")
    .select("*")
    .eq("active", true);
  const coaches = (coachesData ?? []) as Coach[];
  const ids = coaches.map((c) => c.id);
  const { data: profs } =
    ids.length > 0
      ? await supabase.from("profiles").select("*").in("id", ids)
      : { data: [] };
  const profileMap = new Map<string, Profile>(
    (profs ?? []).map((p) => [p.id, p as Profile]),
  );

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
          {/* Poster headline */}
          <h1 className="poster text-crimson">
            <span
              className="load-rise block text-[clamp(1.75rem,8.2vw,5rem)]"
              style={{ animationDelay: "60ms" }}
            >
              Strength Conditioning
            </span>
            <span
              className="load-rise block text-[clamp(3.5rem,15vw,12rem)]"
              style={{ animationDelay: "160ms" }}
            >
              Coaches
            </span>
          </h1>

          {/* Right column — label, statement, established mark */}
          <div className="lg:pt-6">
            <div
              className="load-rise flex items-start gap-2.5"
              style={{ animationDelay: "260ms" }}
            >
              <svg
                width="10"
                height="12"
                viewBox="0 0 10 12"
                fill="var(--crimson)"
                className="mt-0.5 shrink-0"
              >
                <path d="M0 0l10 6-10 6z" />
              </svg>
              <p className="label text-crimson">
                We are
                <br />
                Vigorfit
              </p>
            </div>

            <p
              className="load-rise mt-6 max-w-md text-lg leading-snug text-crimson-lift sm:text-xl"
              style={{ animationDelay: "340ms" }}
            >
              A private coaching studio pairing you with senior coaches who
              program for your body, your schedule, and your goals — then hold
              you to them.
            </p>

            <div
              className="load-rise mt-10 border-b border-rule pb-4"
              style={{ animationDelay: "420ms" }}
            >
              <span className="label text-crimson">Est. 2014</span>
            </div>

            <div
              className="load-rise mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "500ms" }}
            >
              <Link
                href={bookHref}
                className={buttonClasses("primary", "lg", "label px-7")}
              >
                Book a session
              </Link>
              <a
                href="#team"
                className={buttonClasses("hairline", "lg", "label px-7")}
              >
                Meet the team
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
                The studio is adding its coaches now. Log in to see who&rsquo;s
                available and book the moment they&rsquo;re live.
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
                const p = profileMap.get(c.id);
                const name = p?.full_name || "Coach";
                return (
                  <Reveal key={c.id} delay={(i % 3) * 90}>
                    <div className="group flex h-full flex-col border border-line bg-ink/50 p-6 transition-colors hover:border-crimson">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-12 w-12 items-center justify-center bg-crimson font-display text-lg text-white">
                          {initialsOf(name)}
                        </span>
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

          <dl className="mt-16 grid grid-cols-1 gap-8 border-t border-rule pt-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="poster text-5xl text-bone">
                  {s.value}
                  <span className="text-crimson">{s.unit}</span>
                </dt>
                <dd className="mt-1 text-sm leading-snug text-mist">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <section
        id="contact"
        className="relative border-t border-line px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <h2 className="poster h-col text-bone">
              Start a conversation
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-mist">
              Not sure where to begin? Tell us what you&rsquo;re training for
              and we&rsquo;ll point you to the right coach.
            </p>

            <dl className="mt-10 space-y-5 border-t border-rule pt-8">
              <div>
                <dt className="label text-mist">WhatsApp</dt>
                <dd className="mt-1">
                  <a
                    href={waLink("Hi Vigorfit — I'd like to book a session.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="poster inline-flex items-center gap-2.5 text-2xl text-bone transition-colors hover:text-crimson"
                  >
                    <WhatsAppIcon className="text-crimson" />
                    {STUDIO_WHATSAPP_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label text-mist">Email</dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${STUDIO_EMAIL}`}
                    className="poster text-2xl text-bone transition-colors hover:text-crimson"
                  >
                    {STUDIO_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label text-mist">Studio</dt>
                <dd className="poster mt-1 text-2xl text-bone">
                  14 Forge Lane, Unit 3
                </dd>
              </div>
              <div>
                <dt className="label text-mist">Hours</dt>
                <dd className="poster mt-1 text-2xl text-bone">
                  Mon–Sat, 6am–8pm
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-line bg-surface/50 p-6 sm:p-8">
              <ContactForm />
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
    </div>
  );
}
