"use server";

import { revalidatePath } from "next/cache";
import { requireRole, getCurrentProfile } from "@/backend/auth";
import { createClient } from "@/backend/supabase/server";

export type FormState = { error?: string; success?: string };

export async function updateCoachProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(["coach"]);
  const me = await getCurrentProfile();

  const specialty = String(formData.get("specialty") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const active = formData.get("active") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("coaches")
    .update({ specialty, bio, active })
    .eq("id", me!.id);

  if (error) return { error: error.message };

  revalidatePath("/coach/profile");
  return { success: "Profile updated." };
}

/**
 * Saves (or, with null, clears) the signed-in coach's photo. The file itself
 * is uploaded from the browser straight to Storage; this only records its
 * URL, and only accepts one inside the coach's own folder of the bucket.
 */
export async function saveCoachPhotoAction(
  url: string | null,
): Promise<FormState> {
  await requireRole(["coach"]);
  const me = await getCurrentProfile();

  // Same shape as the URL getPublicUrl() returns; a trailing slash on the
  // configured project URL would otherwise make every photo fail this check.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, "");
  const folder = `${base}/storage/v1/object/public/coach-photos/${me!.id}/`;
  if (url !== null && (!url.startsWith(folder) || url.includes(".."))) {
    return { error: "That photo couldn't be saved." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coaches")
    .update({ avatar_url: url })
    .eq("id", me!.id);

  if (error) {
    return {
      error: error.message.includes("avatar_url")
        ? "Photo uploads aren't switched on yet. Ask the studio admin."
        : error.message,
    };
  }

  revalidatePath("/coach/profile");
  revalidatePath("/client/coaches");
  revalidatePath("/");
  return { success: url ? "Photo updated." : "Photo removed." };
}
