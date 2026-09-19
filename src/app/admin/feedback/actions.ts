"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/backend/auth";
import { createClient } from "@/backend/supabase/server";

/** Remove one message from the inbox. Admin-only, by role and by RLS. */
export async function deleteFeedbackAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // Asking for the deleted row back is what tells a real delete from one RLS
  // quietly turned into nothing — both come back without an error.
  const { data, error } = await supabase
    .from("feedback")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data?.length) {
    throw new Error(
      `Could not delete message: ${error?.message ?? "it no longer exists"}`,
    );
  }

  revalidatePath("/admin/feedback");
}
