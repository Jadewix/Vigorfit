-- One-off repair for bookings created on Cloudflare Workers before the
-- timezone fix (src/shared/timezone.ts). Not part of schema.sql, and nothing
-- runs it automatically: run the steps by hand in the Supabase SQL editor.
--
-- What went wrong: Workers run in UTC, and the booking action read the picked
-- date and time on the server's clock. A client who picked Friday 10:00 AM got
-- starts_at = 10:00 UTC, which is 1:00 PM in Beirut, instead of 07:00 UTC. The
-- error is Beirut's offset on the booked day: 3 hours for sessions up to
-- 24 Oct 2026, 2 hours for sessions after the clocks go back.
--
-- For an affected row, the stored UTC clock time is the Beirut time the client
-- picked, so the repair reads it that way, which is right in summer and winter:
--   (starts_at at time zone 'UTC') at time zone 'Asia/Beirut'
--
-- Which rows: only bookings created through the Workers deployment before the
-- fix was deployed. Bookings made from a dev machine in Beirut were stored
-- correctly and must be left alone. No column records which server created a
-- row, and the times alone can't always tell (a Workers booking for 10:00 AM
-- looks just like a genuine 1:00 PM one), so the window is bounded by
-- created_at and every row gets reviewed before anything changes.


-- 1. Preview (read-only). Fill in the window: when the Workers deployment
--    started taking bookings (Cloudflare dashboard -> Workers -> vigorfit ->
--    Deployments; the deploy commit is 2026-09-10 04:01 +03), and when the
--    timezone fix was deployed. The placeholder fails loudly until replaced.
with win as (
  select timestamptz '2026-09-10 04:00+03'             as workers_from,
         timestamptz 'REPLACE WITH THE FIX DEPLOY TIME' as fixed_at
),
b as (
  select bk.*,
         bk.starts_at at time zone 'Asia/Beirut' as shown_now, -- what the app shows
         bk.starts_at at time zone 'UTC'         as picked     -- what the client picked, if Workers stored it
    from public.bookings bk, win
   where bk.created_at >= win.workers_from
     and bk.created_at <  win.fixed_at
)
select id, created_at, status, coach_id, client_id,
       shown_now,
       picked,
       picked at time zone 'Asia/Beirut' as corrected_starts_at,
       -- Workers only accepted real slots, so `picked` must be one
       -- (Mon-Fri 08:00-18:00, Sat 08:00-15:00, on the hour). If it isn't,
       -- the row came from somewhere else: leave it.
       (extract(minute from picked) = 0
        and extract(isodow from picked) between 1 and 6
        and extract(hour from picked) between 8
            and case when extract(isodow from picked) = 6 then 15 else 18 end
       ) as picked_is_slot,
       -- If what the app shows now isn't a real slot (say 7:00 PM), the row
       -- is certainly a Workers booking.
       (extract(minute from shown_now) = 0
        and extract(isodow from shown_now) between 1 and 6
        and extract(hour from shown_now) between 8
            and case when extract(isodow from shown_now) = 6 then 15 else 18 end
       ) as shown_is_slot,
       -- Workers also accepted slots that had already started (up to 3 hours
       -- back). Decide with the coach whether to cancel these.
       picked at time zone 'Asia/Beirut' < created_at as booked_after_start,
       reminder_sent_at
  from b
 order by created_at;


-- 2. Repair the rows you've confirmed came from Workers, in a transaction.
--    ends_at moves with starts_at, so the session length is kept (every
--    expression in SET sees the row's old values).
begin;

update public.bookings
   set starts_at = (starts_at at time zone 'UTC') at time zone 'Asia/Beirut',
       ends_at   = ((starts_at at time zone 'UTC') at time zone 'Asia/Beirut')
                   + (ends_at - starts_at)
 where id in (
   -- the reviewed ids from step 1 (an empty list is a syntax error)
 );

-- 3. The moved bookings were capacity-checked against the wrong instant, so a
--    slot may now hold more than two clients, or one client the same slot
--    twice. Both queries should return nothing. If they don't, sort those
--    bookings out with the coach before committing.
select coach_id, starts_at at time zone 'Asia/Beirut' as slot, count(*)
  from public.bookings
 where status in ('pending', 'confirmed')
 group by coach_id, starts_at
having count(*) > 2;

select client_id, coach_id, starts_at at time zone 'Asia/Beirut' as slot, count(*)
  from public.bookings
 where status in ('pending', 'confirmed')
 group by client_id, coach_id, starts_at
having count(*) > 1;

commit; -- or: rollback;


-- 4. Every WhatsApp message about these bookings (the request to the coach,
--    confirmations, reminders) quoted the wrong time, e.g. "1:00 PM" for a
--    10:00 AM session, so tell both sides the corrected time. Where a
--    reminder already went out with the wrong time and the session is still
--    ahead, clearing reminder_sent_at makes the next cron run send a correct
--    one:
--
--   update public.bookings set reminder_sent_at = null
--    where id in (...) and starts_at > now();
