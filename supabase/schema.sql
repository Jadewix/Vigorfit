-- ============================================================================
--  Coach Booking – database schema, RLS policies, triggers
--  Paste this whole file into the Supabase SQL Editor and run it once.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum for roles
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'coach', 'client');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- profiles: 1-to-1 with auth.users, holds the role + basic info for everyone
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'client',
  username   text,
  full_name  text,
  email      text, -- internal synthetic email (never shown to users)
  phone      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Username is the login identifier. Idempotent so this file is safe to re-run.
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_key
  on public.profiles (username);

-- coaches: public-facing coach info (only rows whose profile.role = 'coach')
create table if not exists public.coaches (
  id          uuid primary key references public.profiles (id) on delete cascade,
  bio         text,
  specialty   text,
  hourly_rate numeric(10, 2),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- availability: a coach's recurring weekly availability windows.
-- NOTE: currently unused — booking slots come from the studio-wide opening
-- hours in src/lib/booking.ts. Kept so per-coach availability can be re-added.
create table if not exists public.availability (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.coaches (id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- bookings: a client books a session with a coach
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles (id) on delete cascade,
  coach_id   uuid not null references public.coaches (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     text not null default 'pending'
             check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes      text,
  reminder_sent_at timestamptz, -- set once a WhatsApp reminder has gone out
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

create index if not exists bookings_client_idx on public.bookings (client_id);
create index if not exists bookings_coach_idx  on public.bookings (coach_id);
create index if not exists availability_coach_idx on public.availability (coach_id);

-- ---------------------------------------------------------------------------
-- 3. Helper: read the current user's role WITHOUT tripping RLS recursion.
--    SECURITY DEFINER lets it read profiles bypassing RLS.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger: when an auth user is created, create their profile (+ coach row).
--    Role / name come from the metadata passed by the admin create-user call.
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

  insert into public.profiles (id, username, email, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new_role
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. Enable Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.coaches      enable row level security;
alter table public.availability enable row level security;
alter table public.bookings     enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Policies
-- ---------------------------------------------------------------------------

-- ---- profiles ----
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.get_my_role() = 'admin'
    -- coaches are public-facing within the studio: anyone signed in can see
    -- a coach's name so they can browse and book.
    or role = 'coach'
    -- a coach may see the profiles of clients who booked them
    or (
      public.get_my_role() = 'coach'
      and id in (select client_id from public.bookings where coach_id = auth.uid())
    )
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.get_my_role() = 'admin');

-- (inserts happen via the SECURITY DEFINER trigger / service role only)

-- ---- coaches ----
drop policy if exists coaches_select on public.coaches;
create policy coaches_select on public.coaches
  for select to authenticated
  using (
    active = true
    or id = auth.uid()
    or public.get_my_role() = 'admin'
  );

drop policy if exists coaches_update on public.coaches;
create policy coaches_update on public.coaches
  for update to authenticated
  using (id = auth.uid() or public.get_my_role() = 'admin')
  with check (id = auth.uid() or public.get_my_role() = 'admin');

drop policy if exists coaches_admin_write on public.coaches;
create policy coaches_admin_write on public.coaches
  for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ---- availability ----
drop policy if exists availability_select on public.availability;
create policy availability_select on public.availability
  for select to authenticated
  using (true);

drop policy if exists availability_write on public.availability;
create policy availability_write on public.availability
  for all to authenticated
  using (coach_id = auth.uid() or public.get_my_role() = 'admin')
  with check (coach_id = auth.uid() or public.get_my_role() = 'admin');

-- ---- bookings ----
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings
  for select to authenticated
  using (
    client_id = auth.uid()
    or coach_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings
  for insert to authenticated
  with check (
    (client_id = auth.uid() and public.get_my_role() = 'client')
    or public.get_my_role() = 'admin'
  );

drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings
  for update to authenticated
  using (
    client_id = auth.uid()
    or coach_id = auth.uid()
    or public.get_my_role() = 'admin'
  )
  with check (
    client_id = auth.uid()
    or coach_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

drop policy if exists bookings_delete on public.bookings;
create policy bookings_delete on public.bookings
  for delete to authenticated
  using (public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 7. Coach photos (same as supabase/coach-photos.sql)
-- ---------------------------------------------------------------------------
-- Photos live in a public Storage bucket, one folder per coach
-- (coach-photos/<coach id>/<timestamp>.jpg); the current photo URL is kept on
-- the coach's own coaches row.

alter table public.coaches add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-photos', 'coach-photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists coach_photos_insert on storage.objects;
create policy coach_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'coach-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.get_my_role() = 'coach'
  );

drop policy if exists coach_photos_select on storage.objects;
create policy coach_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'coach-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists coach_photos_update on storage.objects;
create policy coach_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'coach-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'coach-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists coach_photos_delete on storage.objects;
create policy coach_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'coach-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
--  BOOTSTRAP THE FIRST ADMIN
--  1. Supabase dashboard -> Authentication -> Add user. Use the internal email
--     form of your chosen username and tick "Auto Confirm User". For the
--     username "admin" that email is:  admin@coachbook.local
--  2. Give that account the admin role + username:
--
--     update public.profiles
--        set role = 'admin', username = 'admin'
--      where email = 'admin@coachbook.local';
--
--  Then sign in with username "admin" and the password you set.
-- ============================================================================
