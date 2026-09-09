"use client";

import { useActionState, useState } from "react";
import { createUserAction, type CreateUserState } from "./actions";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/types";

const initialState: CreateUserState = {};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-crimson focus:ring-2 focus:ring-crimson/20";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState,
  );
  const [role, setRole] = useState<Role>("client");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="full_name">
            Full name
          </label>
          <input id="full_name" name="full_name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={inputClass}
          >
            <option value="client">Client</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="e.g. john_doe"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            Lowercase letters, numbers and underscores. This is how they log in.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            WhatsApp number{" "}
            <span className="text-slate-400">
              (required for coaches &amp; clients)
            </span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+961 70 123 456"
            required={role !== "admin"}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            Include the country code — used for booking notifications.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="password">
            Temporary password
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            Share this with the user — they can change it later.
          </p>
        </div>
      </div>

      {role === "coach" && (
        <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="specialty">
              Specialty
            </label>
            <input
              id="specialty"
              name="specialty"
              placeholder="e.g. Strength & Conditioning"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="bio">
              Short bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={2}
              className={inputClass.replace("h-10", "min-h-[64px] py-2")}
            />
          </div>
        </div>
      )}

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
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
