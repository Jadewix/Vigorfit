-- ---------------------------------------------------------------------------
-- Fully private plan (2026-09-17)
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- Requires subscriptions.sql to have been run first.
--
-- Adds 'private' — $200/month, three sessions a week, one client to a slot —
-- to the two check constraints that spell the plans out. Until this runs, the
-- app offers the plan in the admin's dropdowns and Postgres rejects the write,
-- so this file is what actually turns it on.
--
-- The constraints are dropped and re-added rather than altered, because a
-- check constraint's expression cannot be changed in place.
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan is null or plan in ('semi_private', 'classes', 'private'));

alter table public.bookings drop constraint if exists bookings_plan_check;
alter table public.bookings add constraint bookings_plan_check
  check (plan is null or plan in ('semi_private', 'classes', 'private'));
