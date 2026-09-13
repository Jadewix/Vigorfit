-- ---------------------------------------------------------------------------
-- Free first session (2026-09-13)
-- Run this once in the Supabase SQL editor. Safe to re-run.
--
-- A newcomer's first session is free. Rather than storing "free session used"
-- on the profile, it is derived from this flag: a client has used theirs when
-- they hold an is_free booking that is pending, confirmed or completed.
--
-- That is deliberate. Cancelling a free session gives it back, and with the
-- state derived from the booking itself there is no flag to reset, and no way
-- for the two to disagree.
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists is_free boolean not null default false;

-- Looking up "does this client already hold a free session?" on every booking.
create index if not exists bookings_client_free_idx
  on public.bookings (client_id, is_free, status);
