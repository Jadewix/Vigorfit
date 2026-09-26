import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/backend/supabase/admin";
import { createClient } from "@/backend/supabase/server";
import { publicTimetable, type StudioClass } from "@/shared/classes";
import { zonedToday } from "@/shared/timezone";

async function fetchClasses(client: SupabaseClient): Promise<StudioClass[]> {
  // `*` rather than a column list so this keeps working on a database where
  // supabase/class-photos.sql (which adds `photo_url`) hasn't been run yet.
  const { data, error } = await client.from("classes").select("*");
  // No table at all means classes.sql hasn't run: no classes, not a failure.
  if (error?.code === "PGRST205" || error?.code === "42P01") return [];
  if (error) throw error;
  return (data ?? []) as StudioClass[];
}

/**
 * The classes on the landing page, readable by signed-out visitors: every
 * class still running, weekly ones Monday to Sunday and then one-off dates.
 *
 * Read the way getPublicCoaches reads the team, and for the same reason: RLS
 * only lets signed-in users read `classes`, so this reads on the server with
 * the service role. Everything in a class row is already public-facing — its
 * name, photo, description, coach and times.
 *
 * If the service key is missing it falls back to the visitor's own session,
 * which RLS lets read the timetable, so members still see it. Never throws:
 * if both reads fail it returns an empty list and the Classes band shows its
 * empty state instead of taking the homepage down.
 */
export async function getPublicClasses(): Promise<StudioClass[]> {
  const today = zonedToday();
  try {
    return publicTimetable(await fetchClasses(createAdminClient()), today);
  } catch (e) {
    console.error("[public-classes] service-role read failed; using session", e);
  }
  try {
    return publicTimetable(await fetchClasses(await createClient()), today);
  } catch (e) {
    console.error("[public-classes]", e);
    return [];
  }
}
