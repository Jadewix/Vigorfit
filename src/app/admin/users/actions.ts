"use server";

import { revalidatePath } from "next/cache";
import { requireRole, getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUsername, normalizeUsername, usernameToEmail } from "@/lib/username";
import type { Role } from "@/lib/types";

export type CreateUserState = { error?: string; success?: string };

const ROLES: Role[] = ["admin", "coach", "client"];

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  // Only admins can reach this. requireRole redirects otherwise.
  await requireRole(["admin"]);

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "client") as Role;
  const specialty = String(formData.get("specialty") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!username || !password || !full_name) {
    return { error: "Name, username and password are required." };
  }
  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3–30 characters: lowercase letters, numbers and underscores only.",
    };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!ROLES.includes(role)) {
    return { error: "Invalid role." };
  }
  // We message coaches and clients on WhatsApp, so a phone number is required.
  if (role !== "admin" && !phone) {
    return { error: "A phone number is required for coaches and clients." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username), // internal login email, never shown
    password,
    email_confirm: true, // no verification needed; admin vouches for them
    user_metadata: { username, full_name, role, phone, specialty, bio },
  });

  if (error) {
    const taken = /already|exists|registered|duplicate/i.test(error.message);
    return {
      error: taken
        ? `The username "${username}" is already taken.`
        : error.message,
    };
  }

  // Ensure the username is stored on the profile even if the DB trigger
  // predates the username column.
  if (data.user) {
    await admin.from("profiles").update({ username }).eq("id", data.user.id);
  }

  revalidatePath("/admin/users");
  return { success: `Created ${role} account "${username}".` };
}

export type UpdateUserState = { error?: string; success?: string };

/**
 * Edit an existing account's profile details. Role and username are NOT
 * editable here on purpose: username is the login identity (it keys the
 * synthetic auth email), and changing role would require creating/removing the
 * coaches row and could orphan or cascade-delete existing bookings. Those need
 * a dedicated, guarded flow — not a free-text edit.
 */
export async function updateUserAction(
  _prev: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  await requireRole(["admin"]);

  const id = String(formData.get("id") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!id || !full_name) {
    return { error: "A full name is required." };
  }

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  if (!prof) {
    return { error: "That account no longer exists." };
  }
  // Coaches and clients are messaged on WhatsApp, so they need a number.
  if (prof.role !== "admin" && !phone) {
    return { error: "A phone number is required for coaches and clients." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name, phone: phone || null })
    .eq("id", id);
  if (error) {
    return { error: error.message };
  }

  // Coach-only public fields live on the coaches table.
  if (prof.role === "coach") {
    const specialty = String(formData.get("specialty") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const active = formData.get("active") === "on";
    const { error: coachErr } = await admin
      .from("coaches")
      .update({ specialty: specialty || null, bio: bio || null, active })
      .eq("id", id);
    if (coachErr) {
      return { error: coachErr.message };
    }
  }

  revalidatePath("/admin/users");
  return { success: "Changes saved." };
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, { password });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const me = await getCurrentProfile();
  const id = String(formData.get("id") ?? "");

  // Guard: an admin cannot delete their own account here.
  if (!id || id === me?.id) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id); // cascades to profiles/coaches/bookings
  revalidatePath("/admin/users");
}
