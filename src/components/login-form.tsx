"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LoginState } from "@/lib/types";

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
            "radial-gradient(90% 70% at 50% -10%, rgba(225,29,51,0.18), transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center bg-crimson font-display text-lg text-white">
            C
          </span>
          <span className="poster text-2xl text-bone">
            Vigorfit<span className="text-crimson">.</span>
          </span>
        </Link>

        <div className="border border-line bg-surface/70 p-8 backdrop-blur">
          <h1 className="poster text-3xl text-bone">{title}</h1>
          <p className="mt-1.5 text-sm text-mist">{subtitle}</p>

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
                className="h-11 w-full border border-line bg-ink/60 px-3.5 text-sm text-bone placeholder:text-mist/60 outline-none transition focus:border-crimson focus:ring-2 focus:ring-crimson/30"
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
                className="h-11 w-full border border-line bg-ink/60 px-3.5 text-sm text-bone placeholder:text-mist/60 outline-none transition focus:border-crimson focus:ring-2 focus:ring-crimson/30"
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <p className="border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-bone">
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
          <div className="mt-6 text-center text-xs text-mist">{footNote}</div>
        )}
      </div>
    </main>
  );
}
