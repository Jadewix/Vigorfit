-- ---------------------------------------------------------------------------
-- Cancellation policy (2026-09-17)
-- Run this once in the Supabase SQL editor. Safe to re-run.
--
-- The 24-hour notice window needs nothing from the database: it is read off
-- `starts_at`, which is already there. What this file adds is the record of
-- WHO cancelled and WHEN, which is what the free-change count is built on.
--
-- `cancelled_by` is the point of the migration. A member gets three free
-- cancellations or reschedules per subscription month, and a session the
-- coach or the studio dropped must not come out of them. Without this column
-- the two are indistinguishable, so `getChanges()` counts nothing at all
-- rather than charging a member for a cancellation that was not theirs.
--
-- `cancelled_at` is the *act*, not the hour that was given back. Cancelling
-- next month's session is a change made today, so the month it counts against
-- is read from this column and not from `starts_at`.
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists cancelled_by uuid references public.profiles (id)
                                        on delete set null,
  add column if not exists cancelled_at timestamptz;

-- Counting one client's own cancellations inside a date range hits this shape.
create index if not exists bookings_cancelled_by_at_idx
  on public.bookings (cancelled_by, cancelled_at);

-- ---------------------------------------------------------------------------
-- Rows cancelled before this file was run carry neither column. They are left
-- alone deliberately: there is no way to tell now whether the client or the
-- coach cancelled them, and guessing "the client" would open every member's
-- first month with changes already spent.
-- ---------------------------------------------------------------------------
