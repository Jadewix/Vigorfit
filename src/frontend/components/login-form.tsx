"use client";

import { useActionState } from "react";
import { Button } from "@/frontend/ui/button";
import { Wordmark } from "@/frontend/site/wordmark";
import type { LoginState } from "@/shared/types";

const initial: LoginState = {};

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
    <main className="brand-dark grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 font-sans">
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

        <div className="border border-line bg-panel/70 p-8 backdrop-blur">
          <h1 className="display text-3xl text-bone">{title}</h1>
          <p className="mt-1.5 text-sm text-sage-dim">{subtitle}</p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-bone"
              >
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
                className="h-11 w-full border border-line bg-ground/60 px-3.5 text-sm text-bone placeholder:text-sage-dim/60 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/30"
                placeholder="yourusername"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-bone"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 w-full border border-line bg-ground/60 px-3.5 text-sm text-bone placeholder:text-sage-dim/60 outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/30"
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
              className="w-full"
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        {footNote && (
          <div className="mt-6 text-center text-xs text-sage-dim">{footNote}</div>
        )}
      </div>
    </main>
  );
}
