import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** The only coach fields the public site ever shows. */
export type PublicCoach = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  photoUrl: string | null;
};

async function fetchActiveCoaches(
  client: SupabaseClient,
): Promise<PublicCoach[]> {
  // `*` rather than a column list so this keeps working on a database where
  // supabase/coach-photos.sql (which adds avatar_url) hasn't been run yet.
  // coaches holds only public-facing fields, and just the ones below leave
  // this function.
  const { data, error } = await client
    .from("coaches")
    .select("*, profiles(full_name)")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((c) => {
    // coaches.id -> profiles.id is to-one, so PostgREST embeds an object.
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return {
      id: c.id,
      name: profile?.full_name || "Coach",
      specialty: c.specialty,
      bio: c.bio,
      photoUrl: c.avatar_url ?? null,
    };
  });
}

/**
 * Active coaches for the public marketing site, readable by signed-out
 * visitors.
 *
 * RLS only lets signed-in users read `coaches` / `profiles`. Loosening that for
 * `anon` would publish whole profile rows (phone numbers and login usernames
 * included) through the public Supabase API, because RLS filters rows, not
 * columns. So this reads on the server with the service role and selects only
 * the fields the page renders: what leaves the server is exactly what's shown.
 *
 * If that read fails — on Workers the service key is a secret set in the
 * Cloudflare dashboard, so it can be missing there — it falls back to the
 * visitor's own session. RLS lets any signed-in user read active coaches, so
 * members still see the team; only signed-out visitors get the empty state.
 *
 * Never throws: if both reads fail it returns an empty list, and the Team
 * section falls back to its empty state instead of taking the homepage down.
 */
export async function getPublicCoaches(): Promise<PublicCoach[]> {
  try {
    return await fetchActiveCoaches(createAdminClient());
  } catch (e) {
    console.error("[public-coaches] service-role read failed; using session", e);
  }
  try {
    return await fetchActiveCoaches(await createClient());
  } catch (e) {
    console.error("[public-coaches]", e);
    return [];
  }
}
