"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBookingUpdate } from "@/lib/notifications";

/**
 * A client cancels their own booking. RLS restricts the update to bookings
 * where client_id = the current user.
 */
export async function cancelBookingAction(formData: FormData): Promise<void> {
  await requireRole(["client"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);

  // Let the coach know their client cancelled (best-effort).
  await notifyBookingUpdate(id, "coach", "Cancelled by client");

  revalidatePath("/client/bookings");
}
