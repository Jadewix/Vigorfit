"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentProfile } from "@/backend/auth";
import { createClient } from "@/backend/supabase/server";
import { notifyBookingUpdate } from "@/backend/notifications";
import { canCancel } from "@/shared/booking";

/** Postgres: undefined_column — the same code backend/subscription retries on. */
const MISSING_COLUMN = "42703";

/**
 * A client cancels their own booking. RLS restricts the update to bookings
 * where client_id = the current user.
 *
 * The 24-hour lock lives here rather than only in the page that draws the
 * button. The page hides the button once a session is inside the window, but
 * a tab left open since yesterday still holds a live form, so the deadline is
 * re-read against the booking's own start time before anything is written.
 * A stale form lands back on the list with `?locked=1`, which is where the
 * page explains the rule.
 */
export async function cancelBookingAction(formData: FormData): Promise<void> {
  await requireRole(["client"]);
  const me = await getCurrentProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // Read the booking first: the deadline is a property of the session, and
  // the id in the form is the only thing the client controls.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, starts_at, status")
    .eq("id", id)
    .single();

  if (!booking || booking.status === "cancelled") return;
  if (!canCancel(booking.starts_at)) {
    redirect("/client/bookings?locked=1");
  }

  /*
    `cancelled_by` and `cancelled_at` are what the free-change count reads, so
    a session dropped by a coach never comes out of the member's three. Both
    only exist once supabase/cancellation-policy.sql has been run; without it
    the update fails on an unknown column (42703) and is retried as the plain
    status change it used to be, so the cancellation still goes through.

    Only that one code is retried. Any other failure — RLS, a dropped
    connection — is a cancellation that did not happen, and re-running it
    without the columns would not fix it; what matters there is that the
    coach is not told about a session the client still holds.
  */
  let { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: me!.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error?.code === MISSING_COLUMN) {
    ({ error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id));
  }

  if (error) {
    console.error("[cancel]", error.message);
    return;
  }

  // Let the coach know their client cancelled (best-effort).
  await notifyBookingUpdate(id, "coach", "Cancelled by client");

  revalidatePath("/client/bookings");
}
