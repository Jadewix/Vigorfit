"use client";

import { useActionState } from "react";
import { Button } from "@/frontend/ui/button";
import { Wordmark } from "@/frontend/site/wordmark";
import type { LoginState } from "@/shared/types";

const initial: LoginState = {};

// One definition for both fields. 48px tall: the same touch target the site's
// large buttons use, since this is a form people fill in on a phone at the
// door of the gym.
const field =
  "h-12 w-full border border-line bg-ground/60 px-3.5 text-sm text-bone placeholder:text-sage-dim/60 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/30";

export function LoginForm({
  action,
  title,
  subtitle,
  footNote,
}: {
  action: (prev: LoginState, formData: FormData) => Promise<LoginState>;
  title: string;
  subtitle: string;
  footNote?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <main className="brand-dark grain relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 font-sans">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% -10%, rgba(151,176,140,0.14), transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <Wordmark className="mb-8 justify-center" />

        {/*
          A ruled panel rather than a floating card: the heading sits in its
          own cell closed by a hairline, the way the site's nav and bands are
          divided. Nothing here is rounded or shadowed — on the dark surface
          the whole system is built from right angles and 1px rules.
        */}
        <div className="border border-line bg-panel/70 backdrop-blur">
          <div className="border-b border-line px-7 py-6">
            <h1 className="display text-3xl text-bone">{title}</h1>
            <p className="mt-1.5 text-sm text-sage-dim">{subtitle}</p>
          </div>

          <form action={formAction} className="space-y-5 px-7 py-7">
            <div>
              <label htmlFor="username" className="tag mb-2 block text-sage-dim">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                className={field}
                placeholder="yourusername"
              />
            </div>

            <div>
              <label htmlFor="password" className="tag mb-2 block text-sage-dim">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={field}
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <p className="border border-oxblood/60 bg-oxblood/15 px-3 py-2 text-sm text-bone">
                {state.error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="tag w-full"
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        {footNote && (
          <div className="mt-6 text-center text-xs leading-relaxed text-sage-dim">
            {footNote}
          </div>
        )}
      </div>
    </main>
  );
}
