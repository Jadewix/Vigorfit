"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/backend/auth";
import { createClient } from "@/backend/supabase/server";
import { createAdminClient } from "@/backend/supabase/admin";
import {
  classBlocksSlot,
  isClassIcon,
  type StudioClass,
} from "@/shared/classes";
import {
  utcToZonedTime,
  zonedDayRange,
  zonedTimeToUtc,
} from "@/shared/timezone";

export type ClassFormState = {
  error?: string;
  notice?: string;
  /** What was sent, handed back on an error so the form can keep it. */
  values?: Record<string, string>;
  /** Bumped on every result, so the form remounts with `values`. */
  attempt?: number;
};

const TIME = /^\d{2}:\d{2}$/;

function refresh() {
  revalidatePath("/admin/classes");
  revalidatePath("/coach/classes");
  revalidatePath("/coach/schedule");
  revalidatePath("/client/classes");
  // The landing page lists the classes too.
  revalidatePath("/");
}

/**
 * Put a class on a coach's timetable. Admins pick any coach; a coach can
 * only schedule their own classes, whatever the form sends. From then on the
 * booking grid shows that coach as taken for the hours it overlaps.
 *
 * Existing bookings in those hours are left alone — cancelling a client's
 * session is a decision for the studio, not a side effect — but whoever added
 * the class is told how many there are so they can sort them out.
 */
export async function createClassAction(
  prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  const me = await requireRole(["admin", "coach"]);
  const attempt = (prev.attempt ?? 0) + 1;
  // React clears a form after its action runs; handing the fields back lets
  // a rejected form keep what was typed.
  const fail = (error: string): ClassFormState => ({
    error,
    attempt,
    values: Object.fromEntries(
      [...formData].flatMap(([k, v]) =>
        typeof v === "string" && !k.startsWith("$") ? [[k, v]] : [],
      ),
    ),
  });

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  // Only sent when the form had an icon picker, i.e. once class-icons.sql has
  // run. Before that the class goes in without one and shows the default.
  const icon = formData.get("icon");
  const coachId =
    me.role === "coach" ? me.id : String(formData.get("coach_id") ?? "");
  const date = String(formData.get("class_date") ?? "");
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const repeatsWeekly = formData.get("repeats_weekly") === "on";

  if (!name) return fail("Give the class a name.");
  if (name.length > 80) return fail("Keep the name under 80 characters.");
  if (description.length > 1000) {
    return fail("Keep the description under 1000 characters.");
  }
  if (icon !== null && !isClassIcon(icon)) {
    return fail("Choose one of the icons.");
  }
  if (!coachId) return fail("Choose the coach running it.");
  if (!zonedDayRange(date)) return fail("Choose a valid date.");
  if (!TIME.test(start) || !TIME.test(end)) {
    return fail("Choose a start and end time.");
  }
  if (end <= start) return fail("The class must end after it starts.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .insert({
      name,
      description: description || null,
      ...(icon !== null && { icon }),
      coach_id: coachId,
      class_date: date,
      start_time: start,
      end_time: end,
      repeats_weekly: repeatsWeekly,
    })
    .select("*")
    .single();
  // 42501: RLS refused it — for a coach, classes.sql's coach policy is missing.
  if (error?.code === "42501") {
    return fail(
      "You don’t have permission to add classes yet. Ask the studio to re-run supabase/classes.sql.",
    );
  }
  if (error || !data) {
    return fail(`Could not add the class: ${error?.message ?? "unknown error"}`);
  }

  refresh();

  const clashes = await countClashingBookings(data as StudioClass);
  return {
    attempt,
    notice:
      clashes === 0
        ? `“${name}” added.`
        : `“${name}” added. ${clashes} existing booking${clashes === 1 ? "" : "s"} with this coach overlap${clashes === 1 ? "s" : ""} it and ${clashes === 1 ? "was" : "were"} not cancelled — move or cancel ${clashes === 1 ? "it" : "them"} from ${me.role === "coach" ? "My sessions" : "Bookings"}.`,
  };
}

/** Upcoming active bookings with the class's coach that fall inside it. */
async function countClashingBookings(cls: StudioClass): Promise<number> {
  const from = Math.max(
    Date.now(),
    zonedTimeToUtc(cls.class_date, "00:00")!.getTime(),
  );
  let query = createAdminClient()
    .from("bookings")
    .select("starts_at")
    .eq("coach_id", cls.coach_id)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", new Date(from).toISOString());
  if (!cls.repeats_weekly) {
    query = query.lt("starts_at", zonedDayRange(cls.class_date)!.end.toISOString());
  }
  const { data } = await query;
  return (data ?? []).filter((b) => {
    const { date, time } = utcToZonedTime(b.starts_at);
    return classBlocksSlot(cls, date, time);
  }).length;
}

/**
 * Take a class off the timetable; its hours open up for booking again. A
 * coach can only delete their own (RLS says the same).
 */
export async function deleteClassAction(formData: FormData): Promise<void> {
  const me = await requireRole(["admin", "coach"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  let query = supabase.from("classes").delete().eq("id", id);
  if (me.role === "coach") query = query.eq("coach_id", me.id);
  // Asking for the row back tells a real delete from one RLS turned into
  // nothing — both come back without an error.
  const { data, error } = await query.select("id");
  if (error || !data?.length) {
    throw new Error(
      `Could not delete class: ${error?.message ?? "it no longer exists"}`,
    );
  }

  refresh();
}

/**
 * Give a class a different icon, which is also how a class added before
 * icons existed gets one. A coach can only change their own (RLS says the
 * same).
 */
export async function setClassIconAction(formData: FormData): Promise<void> {
  const me = await requireRole(["admin", "coach"]);
  const id = String(formData.get("id") ?? "");
  const icon = formData.get("icon");
  if (!id || !isClassIcon(icon)) return;

  const supabase = await createClient();
  let query = supabase.from("classes").update({ icon }).eq("id", id);
  if (me.role === "coach") query = query.eq("coach_id", me.id);
  const { data, error } = await query.select("id");
  if (error || !data?.length) {
    throw new Error(
      `Could not change the icon: ${error?.message ?? "the class no longer exists"}`,
    );
  }

  refresh();
}
