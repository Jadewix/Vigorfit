"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/backend/auth";
import { createAdminClient } from "@/backend/supabase/admin";
import { prepareStudioCancellationNotice } from "@/backend/notifications";

/**
 * Permanently remove a booking row. Admin-only: `requireRole` is the
 * authorization gate, and the service-role client is used so the delete can't
 * be silently no-opped by a missing/edited RLS policy (a failed delete under
 * RLS returns zero rows and no error, which looks exactly like a dead button).
 */
export async function deleteBookingAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Read who to tell before the row is gone; send only once it really is.
  const notify = await prepareStudioCancellationNotice(id);

  const admin = createAdminClient();
  const { error } = await admin.from("bookings").delete().eq("id", id);
  if (error) {
    // Surface it rather than swallowing — a silent failure is why this looked
    // broken before.
    throw new Error(`Could not delete booking: ${error.message}`);
  }

  await notify();

  // The overview lists recent bookings and booking counts too, and coaches and
  // clients see their own lists, so refresh every view that shows bookings.
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/coach/bookings");
  revalidatePath("/coach");
  revalidatePath("/client/bookings");
}
