import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import type { Profile, Role } from "@/shared/types";

/**
 * Returns the current user's profile (role + info), or null if not signed in.
 * Uses getUser() which validates the session against Supabase (not just the
 * cookie), so it is safe to trust for authorization.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}

/** The home path for a given role. Clients live on the public landing page. */
export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "coach":
      return "/coach";
    case "client":
      return "/";
  }
}

/**
 * Require a signed-in user with one of the allowed roles.
 * Redirects to /login if unauthenticated, or to their own dashboard if their
 * role is not allowed here. Returns the profile when access is granted.
 */
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role)) {
    redirect(dashboardPathForRole(profile.role));
  }
  return profile;
}
