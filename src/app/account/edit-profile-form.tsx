"use client";

import { useActionState } from "react";
import { updateMyProfileAction, type ProfileState } from "./actions";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";

const initial: ProfileState = {};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateMyProfileAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          WhatsApp number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          placeholder="+961 70 123 456"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-400">
          Include the country code — used for booking notifications.
        </p>
      </div>

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

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
