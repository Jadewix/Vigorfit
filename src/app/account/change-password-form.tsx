"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: PasswordState = {};
const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="current">
          Current password
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="new">
          New password
        </label>
        <input
          id="new"
          name="new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
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
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
