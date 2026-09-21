"use client";

import { useActionState } from "react";
import { Button } from "@/frontend/ui/button";
import { createClassAction, type ClassFormState } from "./actions";

const initialState: ClassFormState = {};

const inputClass =
  "h-10 w-full rounded-lg border border-line-light bg-paper-panel px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export function ClassForm({
  coaches,
  today,
}: {
  /** Admins choose the coach; a coach's form leaves it out (it is them). */
  coaches?: { id: string; name: string }[];
  /** Studio date, "YYYY-MM-DD" — the earliest the date picker offers. */
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    createClassAction,
    initialState,
  );
  // Filled only after a rejected submit, so the fields come back as typed.
  const v = state.values ?? {};

  return (
    // The key remounts the form on every result, so defaultValue applies.
    <form key={state.attempt ?? 0} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">
            Class name
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            placeholder="e.g. Yoga"
            defaultValue={v.name}
            className={inputClass}
          />
        </div>
        {coaches && (
          <div>
            <label className={labelClass} htmlFor="coach_id">
              Coach
            </label>
            <select
              id="coach_id"
              name="coach_id"
              required
              defaultValue={v.coach_id ?? ""}
              className={inputClass}
            >
              <option value="">Choose a coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description <span className="text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={v.description}
          className={`${inputClass} h-auto py-2`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="class_date">
            Day
          </label>
          <input
            id="class_date"
            name="class_date"
            type="date"
            required
            min={today}
            defaultValue={v.class_date ?? today}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="start_time">
            Starts
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            required
            defaultValue={v.start_time}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="end_time">
            Ends
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            required
            defaultValue={v.end_time}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="repeats_weekly"
          defaultChecked={v.repeats_weekly === "on"}
          className="h-4 w-4 accent-forest"
        />
        Repeat every week on this day
      </label>

      <p className="text-xs text-ink-muted">
        While the class runs, {coaches ? "the coach’s" : "your"} booking slots
        at that time are unavailable to everyone.
      </p>

      {state.error && (
        <p className="rounded-lg bg-oxblood/10 px-3 py-2 text-sm text-oxblood">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p className="rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">
          {state.notice}
        </p>
      )}

      <Button type="submit" disabled={pending || coaches?.length === 0}>
        {pending ? "Adding…" : "Add class"}
      </Button>
    </form>
  );
}
