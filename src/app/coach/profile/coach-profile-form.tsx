"use client";

import { useActionState } from "react";
import { updateCoachProfileAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import type { Coach } from "@/lib/types";

const initial: FormState = {};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

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

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={coach?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        Accepting new bookings (visible to clients)
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
