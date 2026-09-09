"use server";

import { revalidatePath } from "next/cache";
import { requireRole, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
