"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createBookingAction, type BookingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  SESSION_LABEL,
  SESSION_MINUTES,
  TRACKS,
  capacityFor,
  type Plan,
  type ScheduleTrack,
} from "@/lib/booking";
import { SlotCell, slotStateOf, label12h } from "./slot-cell";

const initial: BookingState = {};
const inputClass =
  "h-11 w-full border border-line bg-ground px-3 text-sm text-bone outline-none transition-colors placeholder:text-sage-dim/60 focus:border-sage";
const labelClass = "tag mb-2 block text-sage-dim";

/**
 * Local Y-M-D, not `toISOString().slice(0,10)` — the latter is UTC and can name
 * the wrong day for anyone east/west of it, which would offer a date the studio
 * isn't actually open on.
 */
function toDateValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

type Slot = { time: string; taken: boolean; mine: boolean; remaining: number };

export function BookForm({
  coachId,
  today,
  plan,
  track,
}: {
  coachId: string;
  /** Today's date on the studio's clock, "YYYY-MM-DD", from the server. */
  today: string;
  /** The subscription, which decides how many clients share a slot. */
  plan?: Plan | null;
  /** Which weekdays they may book. null = no track recorded yet. */
  track?: ScheduleTrack | null;
}) {
  const [state, formAction, pending] = useActionState(
    createBookingAction,
    initial,
  );

  // Stable identities so the calendar isn't handed new props every render.
  // Today is Beirut's date, not the device's: a phone set to another zone would
  // otherwise offer yesterday, or hide today, around midnight.
  const todayDate = useMemo(() => new Date(`${today}T00:00:00`), [today]);
  // Sunday is always out; a client on a schedule track also cannot pick the
  // days their plan does not run on, so those are struck from the calendar
  // rather than offered and then rejected on submit.
  const disabledDays = useMemo(() => {
    const offDays = track
      ? [0, 1, 2, 3, 4, 5, 6].filter(
          (d) => !TRACKS[track].weekdays.includes(d),
        )
      : [0];
    return [{ before: todayDate }, { dayOfWeek: offDays }];
  }, [todayDate, track]);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  // Sunday is closed — block it before we even ask the server.
  const isSunday = date
    ? new Date(`${date}T00:00:00`).getDay() === 0
    : false;

  // Availability we've already fetched is reused for a minute, so stepping
  // back and forth between dates doesn't pay for the round trip each time.
  // Nothing is booked off this cache: createBookingAction re-checks capacity on
  // submit, so a slot that fills in the meantime is caught there.
  const cache = useRef(
    new Map<string, { at: number; slots: Slot[]; closed: boolean }>(),
  );

  useEffect(() => {
    setTime("");
    setClosed(false);
    if (!date || isSunday) {
      setSlots([]);
      return;
    }

    const key = `${coachId}:${date}`;
    const hit = cache.current.get(key);
    if (hit && Date.now() - hit.at < 60_000) {
      setSlots(hit.slots);
      setClosed(hit.closed);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/coaches/${coachId}/slots?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        const next: Slot[] = Array.isArray(data.slots) ? data.slots : [];
        const isClosed = Boolean(data.closed);
        cache.current.set(key, { at: Date.now(), slots: next, closed: isClosed });
        if (cancelled) return;
        setSlots(next);
        setClosed(isClosed);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, isSunday, coachId]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="coach_id" value={coachId} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="duration" value={SESSION_MINUTES} />

      <div>
        <span className={labelClass}>Date</span>
        {/* The value the server action reads; the calendar drives it. */}
        <input type="hidden" name="date" value={date} required />
        <div className="flex justify-center border border-line bg-ground">
          <Calendar
            mode="single"
            selected={date ? new Date(`${date}T00:00:00`) : undefined}
            onSelect={(d) => setDate(d ? toDateValue(d) : "")}
            defaultMonth={todayDate}
            startMonth={todayDate}
            today={todayDate}
            // Past days and Sundays (studio closed) can't be picked at all.
            disabled={disabledDays}
          />
        </div>
        <p className="mt-2 text-xs text-sage-dim">
          Each session is {SESSION_LABEL}.{" "}
          {track
            ? `Your plan trains on ${TRACKS[track].short}.`
            : "Closed Sundays."}
        </p>
      </div>

      <div>
        <label className={labelClass}>Available times</label>
        {!date ? (
          <p className="border border-line bg-panel/40 px-3 py-3 text-sm text-sage-dim">
            Choose a date to see available times.
          </p>
        ) : isSunday || closed ? (
          <p className="border border-line bg-panel/40 px-3 py-3 text-sm text-sage-dim">
            The studio is closed on Sundays. Please pick another day.
          </p>
        ) : loading ? (
          <div
            aria-busy="true"
            className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-4"
          >
            <span className="sr-only">Loading available times…</span>
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className="h-14 animate-pulse border border-line bg-panel/60"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="border border-line bg-panel/40 px-3 py-3 text-sm text-sage-dim">
            No times left on this day. Try another date.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-4">
              {slots.map((s) => (
                <SlotCell
                  key={s.time}
                  time={s.time}
                  state={slotStateOf(s, time === s.time)}
                  remaining={s.remaining}
                  onSelect={() => setTime(s.time)}
                />
              ))}
            </div>
            {/* A legend, because the grid now uses colour to say three
                different things. Each entry names its own state. */}
            <p className="mt-3 text-xs leading-relaxed text-sage-dim">
              Each slot takes up to {capacityFor(plan)} clients.{" "}
              <span className="text-sage">Green is yours</span>,{" "}
              <span className="text-red-lift">red is full</span>.
            </p>
          </>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes for your coach <span className="text-sage-dim/60">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Goals, injuries, anything they should know…"
          className={inputClass.replace("h-11", "min-h-[96px] py-2.5")}
        />
      </div>

      {state.error && (
        <p className="border border-oxblood/60 bg-oxblood/15 px-3 py-2 text-sm text-red-lift">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending || !time}
        className="tag w-full"
      >
        {pending
          ? "Requesting…"
          : time
            ? `Request ${label12h(time)} session`
            : "Select a time"}
      </Button>
      <p className="text-center text-xs text-sage-dim/70">
        Your coach will confirm the session.
      </p>
    </form>
  );
}
