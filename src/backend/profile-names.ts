import type { SupabaseClient } from "@supabase/supabase-js";

/** Shown when a profile row is missing, or has neither a name nor a username. */
const UNKNOWN = "Unknown";

/** A profile reduced to what a list row actually shows. */
export type NamedProfile = { id: string; name: string; phone: string | null };

/**
 * Display name and phone for a set of profile ids, as a map.
 *
 * `loadNames` below is the common case and is built on this, so the name
 * preference — full name, else username, else "Unknown" — still has exactly
 * one definition. Callers needing more than a name take this instead: the
 * coach's weekly schedule wants a number it can ring beside each client.
 *
 * Ids are de-duplicated here, so callers can pass the raw column values
 * straight off a list of bookings. An empty list skips the query entirely.
 */
export async function loadProfiles(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, NamedProfile>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username, phone")
    .in("id", unique);

  return new Map<string, NamedProfile>(
    (data ?? []).map(
      (p) =>
        [
          p.id,
          {
            id: p.id,
            name: p.full_name || p.username || UNKNOWN,
            phone: p.phone ?? null,
          },
        ] as [string, NamedProfile],
    ),
  );
}

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
  const profiles = await loadProfiles(supabase, ids);
  return (id: string) => profiles.get(id)?.name ?? UNKNOWN;
}
