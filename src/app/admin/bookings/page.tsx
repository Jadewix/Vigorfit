import { createClient } from "@/backend/supabase/server";
import { loadNames } from "@/backend/profile-names";
import { requireRole } from "@/backend/auth";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { BookingList } from "@/frontend/components/booking-list";
import { EmptyState } from "@/frontend/components/empty-state";
import { ConfirmSubmit } from "@/frontend/components/confirm-button";
import { CalendarIcon } from "@/frontend/components/icons";
import { FilterChips, type FilterOption } from "@/frontend/ui/filter-chips";
import {
  filterBookings,
  filterHref,
  parseStatus,
  parseWhen,
} from "@/shared/booking-filters";
import { deleteBookingAction } from "./actions";
import type { Booking } from "@/shared/types";

export default async function AdminBookingsPage(
  props: PageProps<"/admin/bookings">,
) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  // `searchParams` is a promise in this version of Next; it must be awaited.
  const params = await props.searchParams;
  const status = parseStatus(params.status);
  const when = parseWhen(params.when);

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("starts_at", { ascending: false });

  const all = (data ?? []) as Booking[];
  const bookings = filterBookings(all, { status, when });

  // Counts come from the unfiltered list, so each chip shows how many rows it
  // would reveal rather than how many are currently on screen.
  const now = new Date().toISOString();
  const chips: FilterOption[] = [
    {
      label: "All",
      href: filterHref("/admin/bookings", {}),
      active: status === "all" && when === "all",
      count: all.length,
    },
    {
      label: "Pending",
      href: filterHref("/admin/bookings", { status: "pending" }),
      active: status === "pending",
      count: all.filter((b) => b.status === "pending").length,
    },
    {
      label: "Confirmed",
      href: filterHref("/admin/bookings", { status: "confirmed" }),
      active: status === "confirmed",
      count: all.filter((b) => b.status === "confirmed").length,
    },
    {
      label: "Upcoming",
      href: filterHref("/admin/bookings", { when: "upcoming" }),
      active: when === "upcoming",
      count: all.filter((b) => b.starts_at >= now && b.status !== "cancelled")
        .length,
    },
    {
      label: "Cancelled",
      href: filterHref("/admin/bookings", { status: "cancelled" }),
      active: status === "cancelled",
      count: all.filter((b) => b.status === "cancelled").length,
    },
  ];

  // Names are looked up for every booking, not just the filtered ones, so
  // switching filters doesn't re-fetch profiles.
  const getName = await loadNames(
    supabase,
    all.flatMap((b) => [b.client_id, b.coach_id]),
  );

  return (
    <>
      <PageHeading
        title="All bookings"
        subtitle="Every session across the studio."
      />

      <FilterChips options={chips} label="Filter bookings" />

      {bookings.length === 0 ? (
        all.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            hint="Sessions booked by clients will appear here."
            icon={<CalendarIcon />}
          />
        ) : (
          <EmptyState
            title="Nothing matches this filter"
            hint="No bookings in this view. Choose another filter above to see the rest."
            icon={<CalendarIcon />}
          />
        )
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
