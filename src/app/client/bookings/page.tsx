import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { loadNames } from "@/backend/profile-names";
import { getCurrentProfile } from "@/backend/auth";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { BookingList } from "@/frontend/components/booking-list";
import { EmptyState } from "@/frontend/components/empty-state";
import { ConfirmSubmit } from "@/frontend/components/confirm-button";
import { CalendarIcon } from "@/frontend/components/icons";
import { cancelBookingAction } from "./actions";
import type { Booking } from "@/shared/types";

export default async function ClientBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const { booked } = await searchParams;
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", me!.id)
    .order("starts_at", { ascending: false });

  const bookings = (data ?? []) as Booking[];
  const getName = await loadNames(
    supabase,
    bookings.map((b) => b.coach_id),
  );

  return (
    <>
      <PageHeading
        title="My bookings"
        subtitle="Your session history and upcoming appointments."
        action={
          <Link
            href="/"
            className="tag text-sage transition-colors hover:text-bone"
          >
            ← Back home
          </Link>
        }
      />

      {booked && (
        <p className="mb-6 border border-oxblood/60 bg-oxblood/15 px-4 py-3 text-sm text-red-lift">
          Your booking request was sent! Your coach will confirm it shortly.
        </p>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          hint="Head to “Find a coach” to book your first session."
          icon={<CalendarIcon />}
        />
      ) : (
        <BookingList
          items={bookings}
          getName={getName}
          showCoach
          renderActions={(b) =>
            (b.status === "pending" || b.status === "confirmed") &&
            b.starts_at >= now ? (
              <form action={cancelBookingAction}>
                <input type="hidden" name="id" value={b.id} />
                <ConfirmSubmit
                  variant="hairline"
                  message="Cancel this booking?"
                >
                  Cancel
                </ConfirmSubmit>
              </form>
            ) : null
          }
        />
      )}
    </>
  );
}
