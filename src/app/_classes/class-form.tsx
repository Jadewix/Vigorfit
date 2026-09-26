"use client";

import { useActionState, useEffect, useId } from "react";
import { Button } from "@/frontend/ui/button";
import type { StudioClass } from "@/shared/classes";
import {
  createClassAction,
  updateClassAction,
  type ClassFormState,
} from "./actions";
import { ClassPhotoField } from "./class-photo";

const initialState: ClassFormState = {};

const inputClass =
  "h-10 w-full rounded-lg border border-line-light bg-paper-panel px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

/** A saved class as the form's fields hold it. */
function valuesOf(cls: StudioClass): Record<string, string> {
  return {
    name: cls.name,
    description: cls.description ?? "",
    coach_id: cls.coach_id,
    class_date: cls.class_date,
    // Postgres answers "HH:MM:SS"; a time input would send the seconds back.
    start_time: cls.start_time.slice(0, 5),
    end_time: cls.end_time.slice(0, 5),
    repeats_weekly: cls.repeats_weekly ? "on" : "",
  };
}

/**
 * Adds a class, or with `cls` edits that one. Editing leaves the photo out:
 * the class's card has its own photo buttons, which save straight away.
 */
export function ClassForm({
  coaches,
  today,
  uploaderId,
  photosReady,
  cls,
  onClose,
}: {
  /** Admins choose the coach; a coach's form leaves it out (it is them). */
  coaches?: { id: string; name: string }[];
  /** Studio date, "YYYY-MM-DD" — the earliest the date picker offers. */
  today: string;
  /** Whoever is filling the form in; their photos go in their own folder. */
  uploaderId: string;
  /** False until supabase/class-photos.sql has run, when there is nowhere to
   *  put a photo, so the upload stays out of the form. */
  photosReady: boolean;
  /** The class being edited; leave out to add a new one. */
  cls?: StudioClass;
  /** Closes the editor: its Cancel button, and a clean save. */
  onClose?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    cls ? updateClassAction : createClassAction,
    initialState,
  );
  // Several forms can be on the page at once, so field ids are made unique.
  const uid = useId();
  const idOf = (field: string) => `${uid}-${field}`;
  // After a rejected submit, the fields come back as typed; before that, an
  // edit starts from the class as saved.
  const v = state.values ?? (cls ? valuesOf(cls) : {});

  // Close the editor a moment after a save with nothing left to sort out, so
  // "saved" shows first and the card then shows the new details.
  useEffect(() => {
    if (!state.done || !onClose) return;
    const t = setTimeout(onClose, 900);
    return () => clearTimeout(t);
  }, [state.done, state.attempt, onClose]);

  return (
    // The key remounts the form on every result, so defaultValue applies.
    <form key={state.attempt ?? 0} action={formAction} className="space-y-4">
      {cls && <input type="hidden" name="id" value={cls.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={idOf("name")}>
            Class name
          </label>
          <input
            id={idOf("name")}
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
            <label className={labelClass} htmlFor={idOf("coach_id")}>
              Coach
            </label>
            <select
              id={idOf("coach_id")}
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

      {photosReady && !cls && (
        <ClassPhotoField uploaderId={uploaderId} defaultUrl={v.photo_url} />
      )}

      <div>
        <label className={labelClass} htmlFor={idOf("description")}>
          Description <span className="text-ink-muted">(optional)</span>
        </label>
        <textarea
          id={idOf("description")}
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={v.description}
          className={`${inputClass} h-auto py-2`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor={idOf("class_date")}>
            Day
          </label>
          <input
            id={idOf("class_date")}
            name="class_date"
            type="date"
            required
            // A weekly class that started weeks ago keeps its first date
            // when edited, so the picker can't refuse it.
            min={cls && cls.class_date < today ? cls.class_date : today}
            defaultValue={v.class_date ?? today}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={idOf("start_time")}>
            Starts
          </label>
          <input
            id={idOf("start_time")}
            name="start_time"
            type="time"
            required
            defaultValue={v.start_time}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={idOf("end_time")}>
            Ends
          </label>
          <input
            id={idOf("end_time")}
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
        <p className="rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest-lift">
          {state.notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending || coaches?.length === 0}>
          {cls
            ? pending
              ? "Saving…"
              : "Save changes"
            : pending
              ? "Adding…"
              : "Add class"}
        </Button>
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
