"use client";

import { useActionState, useState } from "react";
import { createUserAction, type CreateUserState } from "./actions";
import { Button } from "@/frontend/ui/button";
import type { Role } from "@/shared/types";
import {
  PLANS,
  PLAN_VALUES,
  TRACKS,
  TRACK_VALUES,
} from "@/shared/booking";

const initialState: CreateUserState = {};

const inputClass =
  "h-10 w-full rounded-lg border border-line-light bg-paper-panel px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

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
          <p className="mt-1 text-xs text-ink-muted">
            Lowercase letters, numbers and underscores. This is how they log in.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            WhatsApp number{" "}
            <span className="text-ink-muted">
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
          <p className="mt-1 text-xs text-ink-muted">
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
          <p className="mt-1 text-xs text-ink-muted">
            Share this with the user — they can change it later.
          </p>
        </div>
      </div>

      {role === "coach" && (
        <div className="grid gap-4 rounded-lg bg-paper p-4 sm:grid-cols-2">
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

      {role === "client" && (
        <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="plan">
              Subscription
            </label>
            <select
              id="plan"
              name="plan"
              defaultValue=""
              className={inputClass}
            >
              <option value="">Not set yet</option>
              {PLAN_VALUES.map((p) => (
                <option key={p} value={p}>
                  {PLANS[p].label} — ${PLANS[p].priceUsd}/month · {PLANS[p].perWeek}&times; a week
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Until this is set they can sign in, but not book.
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="schedule_track">
              Schedule
            </label>
            <select
              id="schedule_track"
              name="schedule_track"
              defaultValue=""
              className={inputClass}
            >
              <option value="">Not set yet</option>
              {TRACK_VALUES.map((t) => (
                <option key={t} value={t}>
                  {TRACKS[t].short}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Their usual days. They can still book outside them — the booking
              form asks them to keep to the plan rather than refusing the date.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="subscription_ends_on">
              Paid until{" "}
              <span className="text-slate-400">(can be set later)</span>
            </label>
            <input
              id="subscription_ends_on"
              name="subscription_ends_on"
              type="date"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Their 12 sessions a month are counted over the month ending on
              this date, and booking stops once it passes.
            </p>
          </div>
        </div>
      )}

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
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
