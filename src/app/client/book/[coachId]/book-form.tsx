"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createBookingAction, type BookingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { SESSION_LABEL, SESSION_MINUTES } from "@/lib/booking";

const initial: BookingState = {};
const inputClass =
  "h-11 w-full border border-line bg-ink px-3 text-sm text-bone outline-none transition-colors placeholder:text-mist/60 focus:border-crimson";
const labelClass = "label mb-2 block text-mist";

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
/** Shared shape for the time-slot cells, so grid and skeleton stay in step. */
/**
 * Every slot cell is the same fixed size. The time is kept on one line
 * (`whitespace-nowrap` + a slightly smaller size) so cells don't end up a mix
 * of one- and two-line boxes, and `tabular-nums` keeps the digits aligned
 * across the grid.
 */
const slotBase =
  "flex h-14 flex-col items-center justify-center gap-1 border px-1 text-center text-[13px] font-medium leading-none tabular-nums transition-colors";

type Slot = { time: string; taken: boolean; mine: boolean; remaining: number };

/** "14:00" -> "2:00 PM" */
function label12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function BookForm({ coachId }: { coachId: string }) {
  const [state, formAction, pending] = useActionState(
    createBookingAction,
    initial,
  );

  // Stable identities so the calendar isn't handed new props every render.
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const disabledDays = useMemo(
    () => [{ before: todayDate }, { dayOfWeek: [0] }],
    [todayDate],
  );

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
        <div className="flex justify-center border border-line bg-ink">
          <Calendar
            mode="single"
            selected={date ? new Date(`${date}T00:00:00`) : undefined}
            onSelect={(d) => setDate(d ? toDateValue(d) : "")}
            defaultMonth={todayDate}
            startMonth={todayDate}
            // Past days and Sundays (studio closed) can't be picked at all.
            disabled={disabledDays}
          />
        </div>
        <p className="mt-2 text-xs text-mist">
          Each session is {SESSION_LABEL}. Closed Sundays.
        </p>
      </div>

      <div>
        <label className={labelClass}>Available times</label>
        {!date ? (
          <p className="border border-line bg-surface/40 px-3 py-3 text-sm text-mist">
            Choose a date to see available times.
          </p>
        ) : isSunday || closed ? (
          <p className="border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-sm text-amber-300">
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
                className="h-14 animate-pulse border border-line bg-surface/60"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-sm text-amber-300">
            No times left on this day. Try another date.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-4">
              {slots.map((s) =>
                s.taken ? (
                  <span
                    key={s.time}
                    aria-disabled
                    title={s.mine ? "You already booked this time" : "Fully booked"}
                    className={cn(
                      slotBase,
                      "cursor-not-allowed border-line bg-surface/50 text-mist/50",
                    )}
                  >
                    <span className="whitespace-nowrap line-through">
                      {label12h(s.time)}
                    </span>
                    <span className="text-[10px] font-normal uppercase tracking-wide">
                      {s.mine ? "Yours" : "Full"}
                    </span>
                  </span>
                ) : (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => setTime(s.time)}
                    className={cn(
                      slotBase,
                      time === s.time
                        ? "border-crimson bg-crimson text-white"
                        : "border-line bg-ink text-bone hover:border-crimson hover:text-crimson",
                    )}
                  >
                    <span className="whitespace-nowrap">{label12h(s.time)}</span>
                    {s.remaining === 1 && (
                      <span
                        className={cn(
                          "whitespace-nowrap text-[10px] font-normal uppercase tracking-wide",
                          time === s.time ? "text-white/80" : "text-crimson-lift",
                        )}
                      >
                        1 left
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
            <p className="mt-3 text-xs text-mist/70">
              Each slot takes up to 2 clients. Crossed-out times are full.
            </p>
          </>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes for your coach <span className="text-mist/60">(optional)</span>
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
        <p className="border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-crimson-lift">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending || !time}
        className="label w-full"
      >
        {pending
          ? "Requesting…"
          : time
            ? `Request ${label12h(time)} session`
            : "Select a time"}
      </Button>
      <p className="text-center text-xs text-mist/70">
        Your coach will confirm the session.
      </p>
    </form>
  );
}
