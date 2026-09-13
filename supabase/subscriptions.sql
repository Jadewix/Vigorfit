-- ---------------------------------------------------------------------------
-- Subscriptions (2026-09-12)
-- Run this once in the Supabase SQL editor. Safe to re-run.
--
-- Adds the two subscriptions (semi-private / classes) and the two schedule
-- tracks (Mon-Wed-Fri / Tue-Thu-Sat) to client profiles.
--
-- `bookings.plan` records which subscription a session was booked under. It is
-- a snapshot: a client who later switches plans does not retroactively change
-- sessions already booked, and it is what lets the studio decide later whether
-- one hour may hold both a semi-private group and a class.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists plan text,
  add column if not exists schedule_track text;

alter table public.bookings
  add column if not exists plan text;

-- Constraints are added separately so re-running the file doesn't fail on a
-- constraint that already exists.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_plan_check') then
    alter table public.profiles add constraint profiles_plan_check
      check (plan is null or plan in ('semi_private', 'classes'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_schedule_track_check') then
    alter table public.profiles add constraint profiles_schedule_track_check
      check (schedule_track is null or schedule_track in ('mwf', 'tts'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_plan_check') then
    alter table public.bookings add constraint bookings_plan_check
      check (plan is null or plan in ('semi_private', 'classes'));
  end if;
end $$;

-- Slot capacity is counted per coach, per start time, per plan, so this index
-- matches how both the slots API and the booking action query.
create index if not exists bookings_coach_start_plan_idx
  on public.bookings (coach_id, starts_at, plan);

-- ---------------------------------------------------------------------------
-- The signup trigger carries plan + schedule_track through from the admin's
-- "create user" form, alongside the fields it already handled.
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
    id, username, email, full_name, phone, role, plan, schedule_track
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
