-- ---------------------------------------------------------------------------
-- Class photos (2026-09-25)
-- Run this once in the Supabase SQL editor. Safe to re-run.
-- Requires classes.sql to have been run first.
--
-- Each class can carry a photo, uploaded when the class is added (or changed
-- later from the timetable) and shown beside its name on the landing page and
-- in the timetables. The browser crops it to a square and shrinks it to
-- 512 x 512 before uploading, so the files are small whatever was picked.
--
-- A class without a photo keeps showing its icon (see class-icons.sql), so
-- classes added before this runs look exactly as they did. Until it runs, the
-- class form has no photo upload.
-- ---------------------------------------------------------------------------

alter table public.classes add column if not exists photo_url text;

-- Public, so the landing page can show photos to signed-out visitors.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('class-photos', 'class-photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins and coaches upload into a folder named after themselves
-- (class-photos/<their id>/<timestamp>.jpg) and manage only what is in it.
-- Everyone else reads photos through the public URL.
drop policy if exists class_photos_insert on storage.objects;
create policy class_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'class-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.get_my_role() in ('admin', 'coach')
  );

drop policy if exists class_photos_select on storage.objects;
create policy class_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'class-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists class_photos_update on storage.objects;
create policy class_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'class-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'class-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists class_photos_delete on storage.objects;
create policy class_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'class-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
