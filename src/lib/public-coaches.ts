import { createAdminClient } from "@/lib/supabase/admin";

/** The only coach fields the public site ever shows. */
export type PublicCoach = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
};

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
 * Never throws. If the service key is missing or the query fails, it returns
 * an empty list and the Team section falls back to its empty state instead of
 * taking the homepage down.
 */
export async function getPublicCoaches(): Promise<PublicCoach[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("coaches")
      .select("id, specialty, bio, profiles(full_name)")
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
      };
    });
  } catch (e) {
    console.error("[public-coaches]", e);
    return [];
  }
}
