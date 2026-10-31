-- Make file storage work.
--
-- Run this whole file in the Supabase SQL editor. It is safe to run twice, and
-- it repairs every reason an upload comes back as "400 Bad Request":
--
--   * a bucket that does not exist
--   * a bucket that is public when it should be private, or the reverse
--   * a type or size limit somebody set on a bucket, which refuses perfectly
--     good photographs
--   * missing or wrong rules on the files themselves, which Storage reports as
--     a bad request rather than as a refusal
--
-- It does not touch a single file already uploaded.
--
-- If a line cannot be run because this role does not own Storage's tables, the
-- file says so in the Notices rather than failing silently, and names what to
-- do by hand instead.

-- The five buckets: three the office alone may read, two the website reads.
do $$
declare spec record;
begin
  for spec in select * from (values
    ('worker-photos', false),
    ('worker-documents', false),
    ('bills', false),
    ('published-photos', true),
    ('published-cvs', true)
  ) as t(id, is_public)
  loop
    begin
      insert into storage.buckets (id, name, public)
      values (spec.id, spec.id, spec.is_public)
      on conflict (id) do update
        set public = excluded.public,
            file_size_limit = null,
            allowed_mime_types = null;
    exception when others then
      raise notice 'Bucket % could not be created or repaired (%). Add it by hand under Storage: name it exactly %, public = %, and leave the file size limit and allowed MIME types empty.',
        spec.id, sqlerrm, spec.id, spec.is_public;
    end;
  end loop;
end
$$;

-- The rules. Staff write everywhere; only the two published buckets may be
-- read by somebody with no account at all.
do $$
declare
  spec record;
  prefix text;
  stale text;
begin
  for spec in select * from (values
    ('worker-photos', false),
    ('worker-documents', false),
    ('bills', false),
    ('published-photos', true),
    ('published-cvs', true)
  ) as t(id, is_public)
  loop
    -- The same names the migrations use, so running them later replaces these
    -- rules instead of adding a second set beside them.
    prefix := case when spec.is_public then replace(spec.id, '-', '_') else spec.id end;
    begin
      -- Both spellings, so an older set of rules under the other name can
      -- never sit beside the one this file writes.
      foreach stale in array array[spec.id, replace(spec.id, '-', '_')]
      loop
        execute format('drop policy if exists %I on storage.objects', stale || '_read');
        execute format('drop policy if exists %I on storage.objects', stale || '_write');
        execute format('drop policy if exists %I on storage.objects', stale || '_update');
        execute format('drop policy if exists %I on storage.objects', stale || '_delete');
      end loop;

      if spec.is_public then
        execute format(
          'create policy %I on storage.objects for select to anon, authenticated using (bucket_id = %L)',
          prefix || '_read', spec.id);
      else
        execute format(
          'create policy %I on storage.objects for select to authenticated using (bucket_id = %L and ops.is_staff())',
          prefix || '_read', spec.id);
      end if;

      execute format(
        'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and ops.is_staff())',
        prefix || '_write', spec.id);
      execute format(
        'create policy %I on storage.objects for update to authenticated using (bucket_id = %L and ops.is_staff()) with check (bucket_id = %L and ops.is_staff())',
        prefix || '_update', spec.id, spec.id);
      execute format(
        'create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and ops.is_staff())',
        prefix || '_delete', spec.id);
    exception when others then
      raise notice 'The rules for % could not be written (%). Write them in the dashboard instead: Storage, Policies, New policy on %.',
        spec.id, sqlerrm, spec.id;
    end;
  end loop;
end
$$;

-- What it looks like now. Every bucket should be present, with no limits, and
-- four rules each.
select
  v.name as bucket,
  case when b.id is null then 'STILL MISSING' else 'present' end as state,
  case when b.public then 'public' else 'private' end as visibility,
  coalesce(b.file_size_limit::text, 'no limit') as size_limit,
  coalesce(b.allowed_mime_types::text, 'any type') as types,
  (select count(*) from pg_policy p
    where p.polrelid = 'storage.objects'::regclass
      and pg_get_expr(coalesce(p.polqual, p.polwithcheck), p.polrelid) like '%' || v.name || '%') as rules
from (values
  ('worker-photos'), ('worker-documents'), ('bills'), ('published-photos'), ('published-cvs')
) as v(name)
left join storage.buckets b on b.id = v.name
order by v.name;
