import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Wordmark } from "@/frontend/site/wordmark";
import {
  STUDIO_ADDRESS,
  STUDIO_WHATSAPP_DISPLAY,
  WHATSAPP_GREETING,
  waLink,
} from "@/shared/studio";

export const metadata: Metadata = {
  title: "Privacy — Vigorfit",
  description: "What Vigorfit keeps about you, why, and how to have it deleted.",
};

// Pastel page: match the phone browser's toolbar to it, as the login page does.
export const viewport: Viewport = { themeColor: "#c8e8cf" };

/**
 * The privacy policy. Meta asks for one before the WhatsApp app can be
 * published, and "Deleting your data" (#delete) doubles as the data deletion
 * instructions URL it also asks for.
 *
 * Every line here has to stay true to what the code does: if the site starts
 * storing something new, or adds analytics, this page changes with it.
 */
const NOTICE_NUMBER = "+961 79 429 803";

const heading = "display mt-8 text-xl text-bone";
const para = "mt-2 text-sm leading-relaxed text-sage-dim";
const list = "mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-sage-dim";
const link =
  "text-bone underline decoration-line underline-offset-4 transition-colors hover:decoration-sage";

export default function PrivacyPage() {
  const studioChat = (
    <a
      href={waLink(WHATSAPP_GREETING)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${link} whitespace-nowrap`}
    >
      {STUDIO_WHATSAPP_DISPLAY}
    </a>
  );

  return (
    <main className="brand-dark grain relative min-h-screen px-5 py-12 font-sans">
      <div className="relative z-10 mx-auto max-w-2xl">
        <Wordmark className="mb-8" />

        <div className="border border-line bg-panel/70 px-7 py-8">
          <h1 className="display text-3xl text-bone">Privacy</h1>
          <p className="mt-1.5 text-xs text-sage-dim">
            Last updated 30 September 2026
          </p>

          <p className={para}>
            Vigorfit is a private coaching studio at {STUDIO_ADDRESS.join(", ")}.
            This page explains what we keep about you, why, and how to have it
            deleted. For any question about it, message the studio on WhatsApp
            at {studioChat}.
          </p>

          <h2 className={heading}>What we keep</h2>
          <ul className={list}>
            <li>
              <span className="text-bone">Your account:</span> your name,
              username and WhatsApp number. For clients, also your plan and the
              dates your subscription starts and ends. Accounts are opened by
              the studio; there is no public sign-up.
            </li>
            <li>
              <span className="text-bone">Your sessions:</span> the sessions
              you book or that are booked for you, with the coach, date, time
              and status.
            </li>
            <li>
              <span className="text-bone">Coaches:</span> the name and photo
              shown on the site.
            </li>
            <li>
              <span className="text-bone">Feedback:</span> messages sent
              through the feedback box on the site, with a name if you give
              one. Only the studio reads them.
            </li>
          </ul>

          <h2 className={heading}>What we use it for</h2>
          <p className={para}>
            Only to run your bookings and subscription, and to send you
            WhatsApp messages about them: booking requests and updates, a
            reminder before a confirmed session, and a notice before your
            subscription ends. We don&apos;t send advertising, and we don&apos;t
            sell or share your details with anyone.
          </p>

          <h2 className={heading}>WhatsApp messages</h2>
          <p className={para}>
            These come from <span className="whitespace-nowrap">{NOTICE_NUMBER}</span>{" "}
            through Meta&apos;s WhatsApp Business Platform, which handles each
            message to deliver it, under WhatsApp&apos;s own terms and privacy
            policy. Nobody reads replies sent to that number; to talk to the
            studio, write to {studioChat}.
          </p>

          <h2 className={heading}>Where it&apos;s kept</h2>
          <p className={para}>
            The site runs on Cloudflare, and accounts, bookings and photos are
            stored with Supabase. Signing in sets a cookie that keeps you
            logged in. There are no advertising or tracking cookies, and no
            analytics.
          </p>

          <h2 id="delete" className={`${heading} scroll-mt-8`}>
            Deleting your data
          </h2>
          <p className={para}>
            Message the studio on WhatsApp at {studioChat} and ask for your
            data to be deleted. We&apos;ll remove your account, your number and
            your session history, and confirm when it&apos;s done.
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className={link}>
            Back to Vigorfit
          </Link>
        </p>
      </div>
    </main>
  );
}
