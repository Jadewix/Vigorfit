"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { dashboardPathForRole, getCurrentProfile } from "@/backend/auth";
import { usernameToEmail } from "@/backend/username";
import type { LoginState } from "@/shared/types";

/**
 * Single sign-in for everyone. After authenticating, users are routed by role:
 * clients to the landing page, coaches to /coach, admins to /admin.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Your account isn't set up yet. Contact your studio." };
  }

  redirect(dashboardPathForRole(profile.role));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
