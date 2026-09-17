import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { loadNames } from "@/backend/profile-names";
import { getCurrentProfile } from "@/backend/auth";
import { getChanges, getSubscription } from "@/backend/subscription";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { BookingList } from "@/frontend/components/booking-list";
import { EmptyState } from "@/frontend/components/empty-state";
import { ConfirmSubmit } from "@/frontend/components/confirm-button";
import { CalendarIcon } from "@/frontend/components/icons";
import {
  ARRIVAL_NOTE,
  CANCELLATION_NOTICE_HOURS,
  canCancel,
} from "@/shared/booking";
import { cancelBookingAction } from "./actions";
import type { Booking } from "@/shared/types";

export default async function ClientBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; locked?: string }>;
}) {
  const { booked, locked } = await searchParams;
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

  // The free-change count is the subscription month's, so it needs the same
  // renewal date the session allowance is counted against.
  const sub = await getSubscription(me!.id);
  const changes = await getChanges(me!.id, sub.endsOn);

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
        <p className="mb-6 border border-oxblood/60 bg-oxblood/15 px-4 py-3 text-sm leading-relaxed text-red-lift">
          Your booking request was sent! Your coach will confirm it shortly.{" "}
          {ARRIVAL_NOTE}
        </p>
      )}

      {/* Set by the server action when a stale tab submits a cancellation
          that has already passed its deadline. */}
      {locked && (
        <p className="mb-6 border border-oxblood/60 bg-oxblood/15 px-4 py-3 text-sm leading-relaxed text-red-lift">
          That session is inside the {CANCELLATION_NOTICE_HOURS}-hour window and
          can no longer be cancelled here. Message the studio on WhatsApp if
          something has come up.
        </p>
      )}

      {/*
        The cancellation policy, stated once above the list rather than beside
        every booking. Both halves of it are here — the deadline and what a
        fourth change costs — because a member reads this before they need it,
        and the per-row button can only ever say "you cannot do this now".
      */}
      {bookings.length > 0 && (
        <p className="mb-6 border border-line bg-panel/40 px-4 py-3 text-xs leading-relaxed text-sage-dim">
          <span className="text-bone">
            Cancel or move a session at least {CANCELLATION_NOTICE_HOURS} hours
            before it starts.
          </span>{" "}
          Inside that window the booking locks. The first {changes.limit}{" "}
          changes each month are free
          {changes.used > 0 && (
            <>
              {" "}
              —{" "}
              <span className={changes.left === 0 ? "text-red-lift" : "text-bone"}>
                {changes.left === 0
                  ? "you have used all of yours"
                  : `you have ${changes.left} left`}
              </span>
            </>
          )}
          ; after that the studio charges for the change.
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
          renderActions={(b) => {
            const open = b.status === "pending" || b.status === "confirmed";
            if (!open || b.starts_at < now) return null;

            // Past the deadline the button is replaced rather than disabled:
            // a disabled control says "not yet", and this one will never
            // become pressable again.
            if (!canCancel(b.starts_at)) {
              return (
                <span className="tag whitespace-nowrap text-sage-dim/70">
                  Locked
                </span>
              );
            }

            return (
              <form action={cancelBookingAction}>
                <input type="hidden" name="id" value={b.id} />
                <ConfirmSubmit
                  variant="hairline"
                  message={
                    changes.chargeable
                      ? `You have used all ${changes.limit} free changes this month — this one is charged. Cancel anyway?`
                      : "Cancel this booking?"
                  }
                >
                  Cancel
                </ConfirmSubmit>
              </form>
            );
          }}
        />
      )}
    </>
  );
}
