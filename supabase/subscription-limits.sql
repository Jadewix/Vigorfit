-- ---------------------------------------------------------------------------
-- Subscription expiry + session limits (2026-09-13)
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- Requires subscriptions.sql to have been run first.
--
-- `subscription_ends_on` is the "paid until" date the admin sets. It drives
-- three things: the expiry reminder, whether booking is blocked, and the month
-- the 12-session allowance is counted over (the month ENDING on this date, so
-- a client who joined on the 20th gets their allowance from the 20th).
--
-- `subscription_reminder_sent_for` holds the end date we already warned about,
-- so the reminder goes out once per period. Bumping `subscription_ends_on` on
-- renewal makes the two differ again, which re-arms the reminder by itself.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists subscription_ends_on date,
  add column if not exists subscription_reminder_sent_for date;

-- ---------------------------------------------------------------------------
-- Carry the end date through from the admin's "create user" form as well.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.user_role;
begin
  new_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'client'
  );

  insert into public.profiles (
    id, username, email, full_name, phone, role,
    plan, schedule_track, subscription_ends_on
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new_role,
    -- Only clients carry a subscription; empty strings become null.
    case when new_role = 'client'
         then nullif(new.raw_user_meta_data ->> 'plan', '')
         end,
    case when new_role = 'client'
         then nullif(new.raw_user_meta_data ->> 'schedule_track', '')
         end,
    case when new_role = 'client'
         then nullif(new.raw_user_meta_data ->> 'subscription_ends_on', '')::date
         end
  );

  if new_role = 'coach' then
    insert into public.coaches (id, specialty, bio)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'specialty', ''),
      coalesce(new.raw_user_meta_data ->> 'bio', '')
    );
  end if;

  return new;
end;
$$;

-- Counting a client's sessions for the week/month allowance hits this shape.
create index if not exists bookings_client_start_status_idx
  on public.bookings (client_id, starts_at, status);
