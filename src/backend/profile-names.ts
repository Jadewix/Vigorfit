import type { SupabaseClient } from "@supabase/supabase-js";

/** Shown when a profile row is missing, or has neither a name nor a username. */
const UNKNOWN = "Unknown";

/**
 * Display names for a set of profile ids, returned as a lookup function.
 *
 * Every booking list needs the same thing — turn the `client_id` / `coach_id`
 * on a row into something a person can read — and the admin overview, both
 * bookings pages, the coach overview and the client's own list each carried
 * their own copy of this query, its map and its fallback string. One copy
 * means the name preference (full name, else username, else "Unknown") can
 * only be changed in one place.
 *
 * Ids are de-duplicated here, so callers can pass the raw column values
 * straight off a list of bookings. An empty list skips the query entirely.
 */
export async function loadNames(
  supabase: SupabaseClient,
  ids: string[],
): Promise<(id: string) => string> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return () => UNKNOWN;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .in("id", unique);

  const names = new Map<string, string>(
    (data ?? []).map((p) => [p.id, p.full_name || p.username || UNKNOWN]),
  );
  return (id: string) => names.get(id) ?? UNKNOWN;
}
