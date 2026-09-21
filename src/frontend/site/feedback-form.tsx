"use client";

import { useActionState, useState } from "react";
import { buttonClasses } from "@/frontend/ui/button";
import { FEEDBACK_MESSAGE_MAX, FEEDBACK_NAME_MAX } from "@/shared/feedback";

type State = { error?: string; sent?: boolean };

// The login form's fields, so the two forms a visitor can meet on the olive
// are one family. 48px: the site's touch target.
const field =
  "w-full border border-line bg-ground/60 px-3.5 text-sm text-bone placeholder:text-sage-dim/60 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/30";
const label = "tag mb-2 block text-sage-dim";

/**
 * The fields of the "Feedback & Thoughts" box. The box around it — its title,
 * its addressee, its note — is drawn by the page, which owns the copy.
 *
 * The fields are controlled so a message survives a failed send: a form
 * action resets uncontrolled fields whether or not it succeeded, and losing a
 * paragraph someone took the trouble to write is the worst thing this box
 * could do. It is cleared only once the message has actually gone.
 */
export function FeedbackForm({
  action,
  copy,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  copy: {
    message: string;
    name: string;
    send: string;
    sending: string;
    sent: string;
  };
}) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: State, formData: FormData) => {
      const next = await action(prev, formData);
      if (next.sent) {
        setMessage("");
        setName("");
      }
      return next;
    },
    {},
  );

  return (
    <form action={formAction} className="relative space-y-5">
      <div>
        <label htmlFor="feedback-message" className={label}>
          {copy.message}
        </label>
        <textarea
          id="feedback-message"
          name="message"
          required
          rows={5}
          maxLength={FEEDBACK_MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${field} block resize-y py-3 leading-relaxed`}
        />
      </div>

      <div>
        <label htmlFor="feedback-name" className={label}>
          {copy.name}
        </label>
        <input
          id="feedback-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={FEEDBACK_NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${field} h-12`}
        />
      </div>

      {/* Honeypot: invisible and unreachable for people, filled in by bots.
          Zero-sized rather than display:none, which some bots know to skip. */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
      >
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error && (
        <p
          role="alert"
          className="border border-oxblood/60 bg-oxblood/15 px-3 py-2 text-sm text-bone"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClasses("hairline", "lg", "tag px-8")}
        >
          {pending ? copy.sending : copy.send}
        </button>
        {/* Until they start the next one. */}
        {state.sent && !pending && message === "" && (
          <p role="status" className="text-sm text-sage-lift">
            {copy.sent}
          </p>
        )}
      </div>
    </form>
  );
}
