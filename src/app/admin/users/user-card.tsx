"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, buttonClasses } from "@/frontend/ui/button";
import { RoleBadge } from "@/frontend/ui/badge";
import { ConfirmSubmit } from "@/frontend/components/confirm-button";
import { PencilIcon, CloseIcon } from "@/frontend/components/icons";
import { cn, initialsOf } from "@/shared/utils";
import { ResetPasswordButton } from "./reset-password-button";
import { updateUserAction, deleteUserAction, type UpdateUserState } from "./actions";
import type { Role } from "@/shared/types";
import {
  PLANS,
  PLAN_VALUES,
  TRACKS,
  TRACK_VALUES,
  type Plan,
  type ScheduleTrack,
} from "@/shared/booking";

export type AdminUser = {
  id: string;
  role: Role;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  /** Subscription. null until an admin assigns one. */
  plan: Plan | null;
  schedule_track: ScheduleTrack | null;
  /** "paid until" date, "YYYY-MM-DD". */
  subscription_ends_on: string | null;
  /** Preformatted on the server so SSR and client render identical text. */
  joined: string;
  coach: {
    specialty: string | null;
    bio: string | null;
    active: boolean;
  } | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-line-light bg-paper-panel px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

const initialState: UpdateUserState = {};

export function UserCard({
  user,
  isSelf,
}: {
  user: AdminUser;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateUserAction,
    initialState,
  );

  // Collapse the editor a moment after a successful save so the fresh,
  // revalidated values show in the summary.
  useEffect(() => {
    if (state.success && editing) {
      const t = setTimeout(() => setEditing(false), 900);
      return () => clearTimeout(t);
    }
  }, [state.success, editing]);

  const name = user.full_name || user.username || "Unnamed";

  return (
    <li className="rounded-xl border border-line-light bg-paper-panel shadow-sm">
      {/* Summary row — kept compact so the details stay on one line each.
          `relative` anchors the Edit button's stretched hit area below, so
          clicking anywhere on the row opens the editor. */}
      <div className="relative flex items-start gap-3 p-3.5 transition-colors hover:bg-paper">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest/10 text-xs font-bold text-forest">
          {initialsOf(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">
              {name}
            </p>
            <RoleBadge role={user.role} />
            {isSelf && (
              <span className="shrink-0 text-xs text-ink-muted">(you)</span>
            )}
            {user.role === "coach" && user.coach && !user.coach.active && (
              <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                Hidden
              </span>
            )}
          </div>

          <p className="truncate text-xs text-ink-muted">
            {user.username ? `@${user.username}` : "no username"}
          </p>

          <dl className="mt-1.5 space-y-0.5 text-xs">
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-ink-muted">Phone</dt>
              <dd className="truncate text-ink-muted">{user.phone || "—"}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-ink-muted">Joined</dt>
              <dd className="whitespace-nowrap text-ink-muted">
                {user.joined}
              </dd>
            </div>
            {user.role === "client" && (
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-slate-400">Plan</dt>
                <dd className="truncate text-slate-600">
                  {user.plan
                    ? `${PLANS[user.plan].label} · ${
                        user.schedule_track
                          ? TRACKS[user.schedule_track].short
                          : "no schedule"
                      }`
                    : "Not set"}
                </dd>
              </div>
            )}
            {user.role === "client" && user.subscription_ends_on && (
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-slate-400">Paid until</dt>
                <dd className="truncate text-slate-600">
                  {user.subscription_ends_on}
                </dd>
              </div>
            )}
            {user.role === "coach" && user.coach?.specialty && (
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-ink-muted">Specialty</dt>
                <dd className="truncate text-ink-muted">
                  {user.coach.specialty}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          aria-label={editing ? `Close ${name}` : `Edit ${name}`}
          className={cn(
            // after:inset-0 stretches this button across the whole row, so
            // the row is clickable without a second control competing with
            // it for the same action.
            "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
            "after:absolute after:inset-0 after:content-['']",
            editing
              ? "border-forest text-forest"
              : "border-line-light text-ink hover:bg-paper",
          )}
        >
          {editing ? (
            <>
              <CloseIcon width={14} height={14} /> Close
            </>
          ) : (
            <>
              <PencilIcon width={14} height={14} /> Edit
            </>
          )}
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="border-t border-line-light bg-paper/60 p-4 sm:p-5">
          <form action={formAction}>
          <input type="hidden" name="id" value={user.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor={`name-${user.id}`}>
                Full name
              </label>
              <input
                id={`name-${user.id}`}
                name="full_name"
                required
                defaultValue={user.full_name ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`phone-${user.id}`}>
                WhatsApp number
                {user.role !== "admin" && (
                  <span className="text-ink-muted"> (required)</span>
                )}
              </label>
              <input
                id={`phone-${user.id}`}
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ""}
                required={user.role !== "admin"}
                placeholder="+961 70 123 456"
                className={inputClass}
              />
            </div>
          </div>

          {/* Read-only identity — see updateUserAction for why these are fixed. */}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
            <span>
              Username:{" "}
              <span className="font-medium text-ink-muted">
                {user.username || "—"}
              </span>{" "}
              · fixed
            </span>
            <span>
              Role:{" "}
              <span className="font-medium capitalize text-ink-muted">
                {user.role}
              </span>{" "}
              · fixed
            </span>
          </div>

          {user.role === "client" && (
            <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`plan-${user.id}`}>
                  Subscription
                </label>
                <select
                  id={`plan-${user.id}`}
                  name="plan"
                  defaultValue={user.plan ?? ""}
                  className={inputClass}
                >
                  <option value="">Not set</option>
                  {PLAN_VALUES.map((p) => (
                    <option key={p} value={p}>
                      {PLANS[p].label} — ${PLANS[p].priceUsd}/month
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor={`track-${user.id}`}>
                  Schedule
                </label>
                <select
                  id={`track-${user.id}`}
                  name="schedule_track"
                  defaultValue={user.schedule_track ?? ""}
                  className={inputClass}
                >
                  <option value="">Not set</option>
                  {TRACK_VALUES.map((t) => (
                    <option key={t} value={t}>
                      {TRACKS[t].short}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor={`ends-${user.id}`}>
                  Paid until
                </label>
                <input
                  id={`ends-${user.id}`}
                  name="subscription_ends_on"
                  type="date"
                  defaultValue={user.subscription_ends_on ?? ""}
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-slate-400 sm:col-span-2">
                Set both, or neither. With no subscription the client can
                sign in but not book. Renewing means moving the paid-until
                date forward.
              </p>
            </div>
          )}

          {user.role === "coach" && (
            <div className="mt-4 grid gap-4 rounded-lg border border-line-light bg-paper-panel p-4">
              <div>
                <label
                  className={labelClass}
                  htmlFor={`specialty-${user.id}`}
                >
                  Specialty
                </label>
                <input
                  id={`specialty-${user.id}`}
                  name="specialty"
                  defaultValue={user.coach?.specialty ?? ""}
                  placeholder="e.g. Strength & Conditioning"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`bio-${user.id}`}>
                  Short bio
                </label>
                <textarea
                  id={`bio-${user.id}`}
                  name="bio"
                  rows={2}
                  defaultValue={user.coach?.bio ?? ""}
                  className={inputClass.replace("h-10", "min-h-[64px] py-2")}
                />
              </div>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={user.coach?.active ?? false}
                  className="h-4 w-4 rounded border-line-light text-forest focus:ring-forest/30"
                />
                <span className="text-sm text-ink">
                  Visible to clients (listed on the site and bookable)
                </span>
              </label>
            </div>
          )}

          {state.error && (
            <p className="mt-4 rounded-lg bg-oxblood/10 px-3 py-2 text-sm text-oxblood">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="mt-4 rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">
              {state.success}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={buttonClasses("ghost", "sm")}
            >
              Cancel
            </button>
          </div>
          </form>

          {/* Reset password and Delete each render their own <form>, so they
              must live OUTSIDE the edit form above — nested forms are invalid
              HTML and break hydration. */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-light pt-4">
            <span className="mr-auto text-xs font-medium uppercase tracking-wide text-ink-muted">
              Account actions
            </span>
            <ResetPasswordButton
              id={user.id}
              username={user.username ?? user.email ?? "user"}
            />
            {!isSelf && (
              <form action={deleteUserAction}>
                <input type="hidden" name="id" value={user.id} />
                <ConfirmSubmit
                  variant="danger"
                  message={`Delete "${user.username}"? This permanently removes their account and bookings.`}
                >
                  Delete
                </ConfirmSubmit>
              </form>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
