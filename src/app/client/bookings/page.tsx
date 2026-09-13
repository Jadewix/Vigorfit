import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeading } from "@/components/dashboard-shell";
import { BookingList } from "@/components/booking-list";
import { EmptyState } from "@/components/empty-state";
import { ConfirmSubmit } from "@/components/confirm-button";
import { CalendarIcon } from "@/components/icons";
import { cancelBookingAction } from "./actions";
import type { Booking } from "@/lib/types";

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
  const ids = [...new Set(bookings.map((b) => b.coach_id))];
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
