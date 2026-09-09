import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeading } from "@/components/dashboard-shell";
import { BookingList } from "@/components/booking-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/confirm-button";
import { CalendarIcon } from "@/components/icons";
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

export default async function CoachBookingsPage() {
  const supabase = await createClient();
  const me = await getCurrentProfile();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("coach_id", me!.id)
    .order("starts_at", { ascending: true });

  const bookings = (data ?? []) as Booking[];
  const ids = [...new Set(bookings.map((b) => b.client_id))];
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

      {bookings.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          hint="Clients' booking requests will appear here for you to confirm."
          icon={<CalendarIcon />}
        />
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
