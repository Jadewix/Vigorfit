-- ---------------------------------------------------------------------------
-- Feedback (2026-09-19)
-- Run this once in the Supabase SQL editor. Safe to re-run.
--
-- The "Feedback & Thoughts" box in the Contact band. It goes to the admins
-- and no one else: there is no policy that lets a coach or a client read a
-- row, and no column that records who sent it, so a member can say what they
-- think without it reaching the coach it is about.
--
-- Until this runs, the box answers with a "didn't go through" message.
-- ---------------------------------------------------------------------------

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  -- Optional. Blank means the sender chose not to give one.
  name       text check (char_length(name) <= 80),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- No insert grant or policy for anon/authenticated: rows arrive only through
-- the landing page's server action, which writes with the service role. That
-- keeps the public API from being a second, unguarded way in.
grant select, delete on public.feedback to authenticated;

drop policy if exists feedback_admin_select on public.feedback;
create policy feedback_admin_select on public.feedback
  for select to authenticated
  using (public.get_my_role() = 'admin');

drop policy if exists feedback_admin_delete on public.feedback;
create policy feedback_admin_delete on public.feedback
  for delete to authenticated
  using (public.get_my_role() = 'admin');
