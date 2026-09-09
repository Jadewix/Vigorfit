import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/dashboard-shell";
import { BookingList } from "@/components/booking-list";
import { EmptyState } from "@/components/empty-state";
import { ConfirmSubmit } from "@/components/confirm-button";
import { CalendarIcon } from "@/components/icons";
import { deleteBookingAction } from "./actions";
import type { Booking } from "@/lib/types";

export default async function AdminBookingsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("starts_at", { ascending: false });

  const bookings = (data ?? []) as Booking[];
  const ids = [...new Set(bookings.flatMap((b) => [b.client_id, b.coach_id]))];
  const { data: profs } =
    ids.length > 0
      ? await supabase.from("profiles").select("id, full_name, username").in("id", ids)
      : { data: [] };

  const nameMap = new Map<string, string>(
    (profs ?? []).map((p) => [p.id, p.full_name || p.username || "Unknown"]),
  );
  const getName = (id: string) => nameMap.get(id) ?? "Unknown";

  return (
    <>
      <PageHeading
        title="All bookings"
        subtitle="Every session across the studio."
      />

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          hint="Sessions booked by clients will appear here."
          icon={<CalendarIcon />}
        />
      ) : (
        <BookingList
          items={bookings}
          getName={getName}
          showClient
          showCoach
          renderActions={(b) => (
            <form action={deleteBookingAction}>
              <input type="hidden" name="id" value={b.id} />
              <ConfirmSubmit
                variant="danger"
                message="Delete this booking permanently?"
              >
                Delete
              </ConfirmSubmit>
            </form>
          )}
        />
      )}
    </>
  );
}
