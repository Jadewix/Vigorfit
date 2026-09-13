import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeading } from "@/components/dashboard-shell";
import { BookingList } from "@/components/booking-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/confirm-button";
import { CalendarIcon } from "@/components/icons";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import {
  filterBookings,
  filterHref,
  parseStatus,
  parseWhen,
} from "@/lib/booking-filters";
import { setBookingStatusAction } from "./actions";
import type { Booking } from "@/lib/types";

function StatusButton({
  id,
  status,
  children,
  variant,
  confirm,
}: {
  id: string;
  status: string;
  children: React.ReactNode;
  variant: "primary" | "secondary" | "outline" | "danger";
  confirm?: string;
}) {
  return (
    <form action={setBookingStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      {confirm ? (
        <ConfirmSubmit variant={variant} message={confirm}>
          {children}
        </ConfirmSubmit>
      ) : (
        <Button variant={variant} size="sm" type="submit">
          {children}
        </Button>
      )}
    </form>
  );
}

export default async function CoachBookingsPage(
  props: PageProps<"/coach/bookings">,
) {
  const supabase = await createClient();
  const me = await getCurrentProfile();

  // `searchParams` is a promise in this version of Next; it must be awaited.
  const params = await props.searchParams;
  const status = parseStatus(params.status);
  const when = parseWhen(params.when);

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("coach_id", me!.id)
    .order("starts_at", { ascending: true });

  const all = (data ?? []) as Booking[];
  const bookings = filterBookings(all, { status, when });

  // Counts come from the unfiltered list, so each chip shows how many rows it
  // would reveal rather than how many are currently on screen.
  const now = new Date().toISOString();
  const chips: FilterOption[] = [
    {
      label: "All",
      href: filterHref("/coach/bookings", {}),
      active: status === "all" && when === "all",
      count: all.length,
    },
    {
      label: "Upcoming",
      href: filterHref("/coach/bookings", { when: "upcoming" }),
      active: when === "upcoming",
      count: all.filter((b) => b.starts_at >= now && b.status !== "cancelled")
        .length,
    },
    {
      label: "Pending",
      href: filterHref("/coach/bookings", { status: "pending" }),
      active: status === "pending",
      count: all.filter((b) => b.status === "pending").length,
    },
    {
      label: "Past",
      href: filterHref("/coach/bookings", { when: "past" }),
      active: when === "past",
      count: all.filter((b) => b.starts_at < now).length,
    },
  ];

  // Names are looked up for every booking, not just the filtered ones, so
  // switching filters doesn't re-fetch profiles.
  const ids = [...new Set(all.map((b) => b.client_id))];
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
        title="My sessions"
        subtitle="Confirm requests and keep your schedule up to date."
      />

      <FilterChips options={chips} label="Filter sessions" />

      {bookings.length === 0 ? (
        /*
          Two different empty states. "No sessions at all" is an invitation to
          wait for bookings; "nothing matches this filter" is a dead end the
          person can back out of, so it says which filter is responsible.
        */
        all.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            hint="Clients' booking requests will appear here for you to confirm."
            icon={<CalendarIcon />}
          />
        ) : (
          <EmptyState
            title="Nothing matches this filter"
            hint="No sessions in this view. Choose another filter above to see the rest."
            icon={<CalendarIcon />}
          />
        )
      ) : (
        <BookingList
          items={bookings}
          getName={getName}
          showClient
          renderActions={(b) => (
            <>
              {b.status === "pending" && (
                <>
                  <StatusButton id={b.id} status="confirmed" variant="primary">
                    Confirm
                  </StatusButton>
                  <StatusButton
                    id={b.id}
                    status="cancelled"
                    variant="outline"
                    confirm="Decline this booking request?"
                  >
                    Decline
                  </StatusButton>
                </>
              )}
              {b.status === "confirmed" && (
                <>
                  <StatusButton id={b.id} status="completed" variant="secondary">
                    Mark done
                  </StatusButton>
                  <StatusButton
                    id={b.id}
                    status="cancelled"
                    variant="outline"
                    confirm="Cancel this confirmed session?"
                  >
                    Cancel
                  </StatusButton>
                </>
              )}
            </>
          )}
        />
      )}
    </>
  );
}
