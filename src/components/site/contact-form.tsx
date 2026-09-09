"use client";

import { useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { STUDIO_EMAIL, waLink } from "@/lib/studio";

const fieldClass =
  "h-12 w-full border border-line bg-surface px-4 text-sm text-bone placeholder:text-mist/70 outline-none transition focus:border-crimson focus:ring-2 focus:ring-crimson/30";

type Enquiry = {
  name: string;
  email: string;
  goal: string;
  message: string;
};

function readForm(form: HTMLFormElement): Enquiry {
  const data = new FormData(form);
  const get = (k: string) => String(data.get(k) ?? "").trim();
  return {
    name: get("name"),
    email: get("email"),
    goal: get("goal"),
    message: get("message"),
  };
}

/**
 * Joins non-empty sections with a blank line between them. Building the
 * message this way preserves the spacing when optional fields are omitted —
 * filtering one flat list would drop the blank separators along with them.
 */
function joinSections(...sections: string[]): string {
  return sections.filter(Boolean).join("\n\n");
}

/** Conversational opener for WhatsApp; blank fields are simply omitted. */
function composeWhatsApp(e: Enquiry): string {
  const details = [
    e.name && `Name: ${e.name}`,
    e.goal && `Training for: ${e.goal}`,
    e.email && `Email: ${e.email}`,
  ]
    .filter(Boolean)
    .join("\n");

  return joinSections(
    "Hi Vigorfit — I'd like to book a session.",
    details,
    e.message,
  );
}

/**
 * Routes an enquiry to the studio without a backend: WhatsApp click-to-chat
 * (primary) or a pre-filled email (fallback). Both open the visitor's own
 * app with the message ready to send, so the copy says exactly that.
 */
export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [sentVia, setSentVia] = useState<"whatsapp" | "email" | null>(null);

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const enquiry = readForm(ev.currentTarget);
    window.open(waLink(composeWhatsApp(enquiry)), "_blank", "noopener");
    setSentVia("whatsapp");
  }

  function handleEmail() {
    const form = formRef.current;
    if (!form) return;
    // Mirror the browser's own required-field validation for this second path.
    if (!form.reportValidity()) return;

    const e = readForm(form);
    const subject = `Coaching enquiry — ${e.name || "New enquiry"}`;
    const details = [
      e.name && `Name: ${e.name}`,
      e.email && `Email: ${e.email}`,
      e.goal && `Training for: ${e.goal}`,
    ]
      .filter(Boolean)
      .join("\n");
    const body = joinSections(details, e.message);

    window.location.href = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSentVia("email");
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="c-name"
            className="mb-1.5 block text-sm font-medium text-bone"
          >
            Your name
          </label>
          <input
            id="c-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Jordan Rivera"
          />
        </div>
        <div>
          <label
            htmlFor="c-email"
            className="mb-1.5 block text-sm font-medium text-bone"
          >
            Email <span className="text-mist">(optional)</span>
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="c-goal"
          className="mb-1.5 block text-sm font-medium text-bone"
        >
          What are you training for?
        </label>
        <input
          id="c-goal"
          name="goal"
          type="text"
          className={fieldClass}
          placeholder="Strength, a first marathon, coming back from injury…"
        />
      </div>

      <div>
        <label
          htmlFor="c-message"
          className="mb-1.5 block text-sm font-medium text-bone"
        >
          Message
        </label>
        <textarea
          id="c-message"
          name="message"
          required
          rows={4}
          className={`${fieldClass} h-auto resize-y py-3`}
          placeholder="Tell us where you're starting from and what you'd like to change."
        />
      </div>

      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className={buttonClasses("primary", "lg")}>
          <WhatsAppIcon />
          Message on WhatsApp
        </button>
        <button
          type="button"
          onClick={handleEmail}
          className={buttonClasses("hairline", "lg")}
        >
          Email instead
        </button>
      </div>

      {sentVia && (
        <p className="text-sm text-mist" role="status">
          {sentVia === "whatsapp"
            ? "WhatsApp should be open with your message ready to send."
            : "Your email app should be open with the message ready to send."}
        </p>
      )}
    </form>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.03 0 1.2.87 2.35.99 2.51.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  );
}
