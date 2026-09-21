-- ---------------------------------------------------------------------------
-- Classes (2026-09-21)
-- Run this once in the Supabase SQL editor. Safe to re-run.
--
-- Classes the admin schedules from /admin/classes (or a coach from
-- /coach/classes, for themselves). Each one belongs to a
-- coach and runs on a date (optionally every week on that weekday), from
-- start_time to end_time on the studio's clock. While it runs, that coach's
-- booking slots are unavailable to everyone.
--
-- Until this runs, /admin/classes says so and booking works as before.
-- ---------------------------------------------------------------------------

create table if not exists public.classes (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 80),
  description    text check (char_length(description) <= 1000),
  coach_id       uuid not null references public.coaches (id) on delete cascade,
  class_date     date not null,
  start_time     time not null,
  end_time       time not null,
  repeats_weekly boolean not null default false,
  created_at     timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists classes_coach_idx on public.classes (coach_id);

alter table public.classes enable row level security;

grant select, insert, update, delete on public.classes to authenticated;

-- Anyone signed in may read the timetable (clients see upcoming classes,
-- coaches see theirs on their schedule). Admins write any class; a coach
-- writes only their own.
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select to authenticated
  using (true);

drop policy if exists classes_admin_write on public.classes;
create policy classes_admin_write on public.classes
  for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

drop policy if exists classes_coach_write on public.classes;
create policy classes_coach_write on public.classes
  for all to authenticated
  using (coach_id = auth.uid() and public.get_my_role() = 'coach')
  with check (coach_id = auth.uid() and public.get_my_role() = 'coach');

-- ---------------------------------------------------------------------------
-- Clean-up: the per-coach `availability` table was never used — booking
-- slots come from the studio's opening hours in src/shared/booking.ts — and
-- classes now cover "this coach is busy then". It holds no rows the app ever
-- wrote.
-- ---------------------------------------------------------------------------
drop table if exists public.availability;
