"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBookingUpdate } from "@/lib/notifications";
import type { BookingStatus } from "@/lib/types";

const ALLOWED: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

/**
 * Coaches (and admins) change a booking's status. RLS guarantees a coach can
 * only touch bookings where coach_id = their own id.
 */
export async function setBookingStatusAction(formData: FormData): Promise<void> {
  await requireRole(["coach", "admin"]);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  if (!id || !ALLOWED.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("bookings").update({ status }).eq("id", id);

  // Notify the client of the outcome (best-effort).
  if (status === "confirmed") {
    await notifyBookingUpdate(id, "client", "Confirmed ✅");
  } else if (status === "cancelled") {
    await notifyBookingUpdate(id, "client", "Cancelled");
  }

  revalidatePath("/coach/bookings");
  revalidatePath("/coach");
}
