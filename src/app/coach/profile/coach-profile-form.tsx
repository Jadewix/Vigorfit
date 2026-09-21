"use client";

import { useActionState } from "react";
import { updateCoachProfileAction, type FormState } from "./actions";
import { Button } from "@/frontend/ui/button";
import type { Coach } from "@/shared/types";

const initial: FormState = {};
const inputClass =
  "h-10 w-full rounded-lg border border-line-light bg-paper-panel px-3 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export function CoachProfileForm({ coach }: { coach: Coach | null }) {
  const [state, formAction, pending] = useActionState(
    updateCoachProfileAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="specialty">
            Specialty
          </label>
          <input
            id="specialty"
            name="specialty"
            defaultValue={coach?.specialty ?? ""}
            placeholder="e.g. Strength & Conditioning"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={coach?.bio ?? ""}
          placeholder="Tell clients about your background and coaching style."
          className={inputClass.replace("h-10", "min-h-[80px] py-2")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={coach?.active ?? true}
          className="h-4 w-4 rounded border-line-light text-forest-lift focus:ring-forest/40"
        />
        Accepting new bookings (visible to clients)
      </label>

      {state.error && (
        <p className="rounded-lg bg-oxblood/10 px-3 py-2 text-sm text-oxblood">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest-lift">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
