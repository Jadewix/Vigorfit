"use client";

import { useRef } from "react";
import { buttonClasses } from "@/frontend/ui/button";
import { WhatsAppIcon } from "@/frontend/components/icons";

/**
 * "I'm coming" on a class.
 *
 * A Classes member goes straight to the studio's WhatsApp with the message
 * written for them. Anyone else — semi-private, private, no plan, or a
 * Classes plan that has ended — cannot send that message; they get a pop-up
 * explaining classes are their own subscription, with a button that opens
 * WhatsApp asking to enroll (or renew) instead.
 */
export function JoinButton({
  className,
  comingHref,
  enrollHref,
  renew,
}: {
  className: string;
  /** Set only when the viewer may join. */
  comingHref: string | null;
  enrollHref: string;
  renew: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  if (comingHref) {
    return (
      <a
        href={comingHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses("primary", "md", className)}
      >
        <WhatsAppIcon width={16} height={16} />
        I&rsquo;m coming
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={buttonClasses("primary", "md", className)}
      >
        I&rsquo;m coming
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="enroll-title"
        // Clicking the backdrop (the dialog element itself) closes it.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] border border-line bg-ground p-0 text-bone backdrop:bg-black/70"
      >
        <div className="p-6">
          <h2 id="enroll-title" className="display text-2xl text-sage">
            {renew ? "Renew to join" : "Classes are a separate plan"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-sage-dim">
            {renew
              ? "Your Classes subscription has ended. Renew it with the studio and you can join any class."
              : "Your subscription doesn’t include classes. Enroll in the Classes subscription to join them."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={enrollHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => dialog.current?.close()}
              className={buttonClasses("primary", "md")}
            >
              <WhatsAppIcon width={16} height={16} />
              {renew ? "Renew on WhatsApp" : "Enroll on WhatsApp"}
            </a>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={buttonClasses("ghost", "md")}
            >
              Not now
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
