"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { ConfirmSubmit } from "@/components/confirm-button";
import { PencilIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ResetPasswordButton } from "./reset-password-button";
import { updateUserAction, deleteUserAction, type UpdateUserState } from "./actions";
import type { Role } from "@/lib/types";

export type AdminUser = {
  id: string;
  role: Role;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  /** Preformatted on the server so SSR and client render identical text. */
  joined: string;
  coach: {
    specialty: string | null;
    bio: string | null;
    active: boolean;
  } | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-crimson focus:ring-2 focus:ring-crimson/20";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

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
    <li className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Summary row — kept compact so the details stay on one line each */}
      <div className="flex items-start gap-3 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crimson/10 text-xs font-bold text-crimson">
          {initialsOf(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {name}
            </p>
            <RoleBadge role={user.role} />
            {isSelf && (
              <span className="shrink-0 text-xs text-slate-400">(you)</span>
            )}
            {user.role === "coach" && user.coach && !user.coach.active && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Hidden
              </span>
            )}
          </div>

          <p className="truncate text-xs text-slate-500">
            {user.username ? `@${user.username}` : "no username"}
          </p>

          <dl className="mt-1.5 space-y-0.5 text-xs">
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-slate-400">Phone</dt>
              <dd className="truncate text-slate-600">{user.phone || "—"}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-slate-400">Joined</dt>
              <dd className="whitespace-nowrap text-slate-600">
                {user.joined}
              </dd>
            </div>
            {user.role === "coach" && user.coach?.specialty && (
              <div className="flex gap-1.5">
                <dt className="shrink-0 text-slate-400">Specialty</dt>
                <dd className="truncate text-slate-600">
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
            "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
            editing
              ? "border-crimson text-crimson"
              : "border-slate-300 text-slate-700 hover:bg-slate-50",
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
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
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
                  <span className="text-slate-400"> (required)</span>
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
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
            <span>
              Username:{" "}
              <span className="font-medium text-slate-500">
                {user.username || "—"}
              </span>{" "}
              · fixed
            </span>
            <span>
              Role:{" "}
              <span className="font-medium capitalize text-slate-500">
                {user.role}
              </span>{" "}
              · fixed
            </span>
          </div>

          {user.role === "coach" && (
            <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
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
                  className="h-4 w-4 rounded border-slate-300 text-crimson focus:ring-crimson/30"
                />
                <span className="text-sm text-slate-700">
                  Visible to clients (listed on the site and bookable)
                </span>
              </label>
            </div>
          )}

          {state.error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
            <span className="mr-auto text-xs font-medium uppercase tracking-wide text-slate-400">
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
