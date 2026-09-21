import { createAdminClient } from "@/backend/supabase/admin";
import { runsOn, type StudioClass } from "@/shared/classes";

/**
 * Every class a coach could be teaching on `date`: one-offs on that day and
 * weekly ones that have started by then. The weekday match is finished in
 * memory by `runsOn`, which keeps the query simple.
 *
 * Read with the service role, since the slots API and the booking action
 * both need a coach's classes whoever is asking. Before supabase/classes.sql
 * has run there is no table, and that reads as "no classes" rather than
 * taking booking down with it.
 */
export async function classesForCoachOn(
  coachId: string,
  date: string,
): Promise<StudioClass[]> {
  const { data, error } = await createAdminClient()
    .from("classes")
    .select("*")
    .eq("coach_id", coachId)
    .or(`class_date.eq.${date},and(repeats_weekly.eq.true,class_date.lte.${date})`);
  if (error) return [];
  return (data as StudioClass[]).filter((c) => runsOn(c, date));
}
