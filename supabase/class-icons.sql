-- ---------------------------------------------------------------------------
-- Class icons (2026-09-24)
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- Requires classes.sql to have been run first.
--
-- Gives every class an icon, picked when the class is added (or changed later
-- from the timetable) and shown beside its name on the landing page and in
-- the timetables. The column holds the icon's key, e.g. 'lotus'. The list of
-- keys lives in the app (CLASS_ICONS in src/shared/classes.ts) rather than in
-- a check constraint here, so adding an icon never needs another migration;
-- a key the app doesn't know shows as the default icon.
--
-- Classes added before this runs keep a null icon and show the default until
-- someone picks theirs. Until it runs, the class form has no icon picker.
-- ---------------------------------------------------------------------------

alter table public.classes
  add column if not exists icon text check (char_length(icon) <= 40);
