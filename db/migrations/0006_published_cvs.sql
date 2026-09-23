-- The CV a visitor to the website can read.
--
-- A photograph tells somebody almost nothing; the CV is what they actually
-- want, and until now it was only ever a file name on the record. So a CV is
-- now a file like the photograph is, kept in the private worker-documents
-- bucket, copied into a public one when the worker is published, and removed
-- from it the moment she is not.
--
--   https://<project>.supabase.co/storage/v1/object/public/published-cvs/<cv_path>
--
-- What this means is worth saying plainly: a published CV is readable by
-- anyone who has its address, with no key and no sign-in, for as long as the
-- worker is on the website. That is what putting a CV on a public site is.
-- Keep passport scans and identity papers out of the file, and unpublish a
-- worker to withdraw hers.

-- The file name is kept beside the path, because a path is a uuid and the
-- office needs to see the document it uploaded.
alter table ops.applicants add column if not exists cv_file_name text;

insert into storage.buckets (id, name, public)
values ('published-cvs', 'published-cvs', true)
on conflict (id) do update set public = true;

do $$
begin
  execute 'drop policy if exists published_cvs_read on storage.objects';
  execute 'drop policy if exists published_cvs_write on storage.objects';
  execute 'drop policy if exists published_cvs_update on storage.objects';
  execute 'drop policy if exists published_cvs_delete on storage.objects';

  execute $p$create policy published_cvs_read on storage.objects
    for select to anon, authenticated using (bucket_id = 'published-cvs')$p$;
  execute $p$create policy published_cvs_write on storage.objects
    for insert to authenticated with check (bucket_id = 'published-cvs' and ops.is_staff())$p$;
  execute $p$create policy published_cvs_update on storage.objects
    for update to authenticated using (bucket_id = 'published-cvs' and ops.is_staff())
    with check (bucket_id = 'published-cvs' and ops.is_staff())$p$;
  execute $p$create policy published_cvs_delete on storage.objects
    for delete to authenticated using (bucket_id = 'published-cvs' and ops.is_staff())$p$;
end
$$;

-- The view gains cv_path. A column cannot be added to the middle of a view in
-- place, and the order matters less than keeping this definition identical to
-- the one in 0002_security.sql, so that either file can be run again in any
-- order and leave the same view behind.
drop view if exists public.published_workers;

create view public.published_workers as
  select
    a.id,
    a.english_name,
    a.arabic_name,
    a.gender,
    extract(year from age(a.dob))::int as age,
    a.country,
    a.profession,
    a.type,
    a.experience_years,
    a.photo_path,
    a.cv_path,
    a.updated_at
  from ops.applicants a
  where a.published_to_website
    and a.status = 'Available';

comment on view public.published_workers is
  'Public projection for eleutheria.agency. Add columns here deliberately: anything listed becomes world readable.';

grant select on public.published_workers to anon, authenticated;
