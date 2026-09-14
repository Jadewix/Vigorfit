"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/backend/supabase/server";
import { createAdminClient } from "@/backend/supabase/admin";

export type PasswordState = { error?: string; success?: string };
export type ProfileState = { error?: string; success?: string };

/**
 * Update the signed-in user's own name and phone. Done with the service client
 * scoped to their own id (profiles RLS only allows admin writes), and it only
 * ever touches these two fields — never role.
 */
export async function updateMyProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!full_name) return { error: "Name is required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name, phone: phone || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: "Profile updated." };
}

/**
 * Change the signed-in user's own password. Re-verifies the current password
 * first so an unattended session can't be used to silently change it.
 */
export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { error: "You're not signed in." };
  }

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("new") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next) {
    return { error: "Please fill in all fields." };
  }
  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "New passwords don't match." };
  }
  if (next === current) {
    return { error: "New password must be different from the current one." };
  }

  // Verify the current password.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (verifyError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: next,
  });
  if (updateError) {
    return { error: updateError.message };
  }

  return { success: "Password updated." };
}
