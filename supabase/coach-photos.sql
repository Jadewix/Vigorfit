-- Coach profile photos. Run once in the Supabase SQL editor; safe to re-run.
-- (schema.sql includes the same statements for fresh setups.)
--
-- Photos live in a public Storage bucket, one folder per coach
-- (coach-photos/<coach id>/<timestamp>.jpg). The coach's current photo URL
-- is kept on their public-facing coaches row, which they can already update.

alter table public.coaches add column if not exists avatar_url text;

-- Public, so the site can show photos without signing anyone in. The
-- uploader sends ~60 KB JPEGs; the 2 MB cap and type list are a backstop.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coach-photos', 'coach-photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A signed-in coach can add, see, replace and delete files only inside their
-- own folder. Everyone else reads photos through the public URL.
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
