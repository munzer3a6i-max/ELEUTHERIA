-- 0005_published_photos.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- Photographs of the workers who are on the website.
--
-- worker-photos is private and holds every applicant's photograph. That is
-- right for a file about somebody who has not been published anywhere, and
-- wrong for the website, whose visitors have no account and no key.
--
-- So there are two buckets. A photograph is copied into the public one when
-- somebody deliberately publishes that worker, and removed from it the moment
-- they stop. What is publicly readable is then exactly what somebody chose to
-- publish, rather than everything that happens to have been uploaded.
--
-- The object keeps the same key in both, so the view's photo_path is all the
-- website needs:
--
--   https://<project>.supabase.co/storage/v1/object/public/published-photos/<photo_path>

insert into storage.buckets (id, name, public)
values ('published-photos', 'published-photos', true)
on conflict (id) do update set public = true;

-- Staff put photographs here and take them away; everyone may look.
do $$
begin
  execute 'drop policy if exists published_photos_read on storage.objects';
  execute 'drop policy if exists published_photos_write on storage.objects';
  execute 'drop policy if exists published_photos_update on storage.objects';
  execute 'drop policy if exists published_photos_delete on storage.objects';

  execute $p$create policy published_photos_read on storage.objects
    for select to anon, authenticated using (bucket_id = 'published-photos')$p$;
  execute $p$create policy published_photos_write on storage.objects
    for insert to authenticated with check (bucket_id = 'published-photos' and ops.is_staff())$p$;
  execute $p$create policy published_photos_update on storage.objects
    for update to authenticated using (bucket_id = 'published-photos' and ops.is_staff())
    with check (bucket_id = 'published-photos' and ops.is_staff())$p$;
  execute $p$create policy published_photos_delete on storage.objects
    for delete to authenticated using (bucket_id = 'published-photos' and ops.is_staff())$p$;
end
$$;
