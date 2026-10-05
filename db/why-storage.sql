-- Why is the upload refused?
--
-- Paste this whole file into the SQL editor and read the table it returns.
-- Each row is one step of what Storage does when the dashboard uploads a
-- photograph, in order, with the answer the database actually gives. The
-- first row that reads badly is the cause.
--
-- It changes nothing: the one row it writes to test the rules is deleted
-- again before the file ends, and no file is uploaded anywhere.

create or replace function pg_temp.why_storage() returns table (step text, answer text)
language plpgsql as $$
declare
  uid uuid;
  who text;
  probe text := 'diagnostic/' || gen_random_uuid() || '.png';
  n int;
begin
  -- 1. Does the bucket exist, and will it take a picture?
  if not exists (select 1 from storage.buckets where id = 'worker-photos') then
    return query select 'the worker-photos bucket'::text, 'MISSING — run db/fix-storage.sql'::text;
    return;
  end if;
  return query
    select 'the worker-photos bucket'::text,
           ('present, ' || case when b.public then 'public' else 'private' end
             || ', ' || coalesce('size limit ' || b.file_size_limit::text, 'no size limit')
             || ', ' || coalesce('only ' || b.allowed_mime_types::text, 'any type'))::text
    from storage.buckets b where b.id = 'worker-photos';

  -- 2. Is there a rule that lets anybody upload to it at all? With none,
  --    every upload is refused, and Storage calls that a bad request.
  select count(*) into n
  from pg_policy p
  where p.polrelid = 'storage.objects'::regclass
    and p.polcmd in ('a', '*')
    and pg_get_expr(coalesce(p.polwithcheck, p.polqual), p.polrelid) like '%worker-photos%';
  return query
    select 'rules allowing an upload to it'::text,
           case when n = 0
             then 'NONE — this alone refuses every upload. See the note at the end of this file.'
             else n::text || ' (enough)' end;

  -- 3. Is there an account to test with?
  select s.user_id, s.username into uid, who
  from ops.staff s where s.status = 'Active' and s.user_id is not null
  order by s.username limit 1;
  if uid is null then
    return query select 'an account to test with'::text,
      'none — no active staff row points at a sign-in account. Settings, Users, Link sign-in accounts.'::text;
    return;
  end if;
  return query select 'testing as'::text, who;

  -- 4. The chain the rules walk, with the settings Storage puts on the
  --    connection rather than the ones PostgREST puts there.
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid::text, true);

  return query select 'auth.uid() sees'::text,
    coalesce(auth.uid()::text, 'NOTHING — this project''s auth.uid() does not read the setting Storage sets')::text;
  return query select 'ops.caller_uid() sees'::text,
    coalesce((select ops.caller_uid()::text), 'NOTHING — run db/migrations/0012_caller_identity.sql')::text;
  return query select 'ops.is_staff() answers'::text,
    case when (select ops.is_staff()) then 'yes'::text else 'NO — so every rule refuses this account'::text end;

  -- 5. The upload itself, as the role Storage uses.
  begin
    execute 'set local role authenticated';
    begin
      insert into storage.objects (bucket_id, name, owner) values ('worker-photos', probe, uid);
      return query select 'an upload to worker-photos'::text, 'ACCEPTED — uploads should work now'::text;
    exception when others then
      return query select 'an upload to worker-photos'::text, ('REFUSED: ' || sqlerrm)::text;
    end;
    execute 'reset role';
  exception when others then
    execute 'reset role';
    return query select 'becoming the authenticated role'::text, ('could not: ' || sqlerrm)::text;
  end;

  delete from storage.objects where name = probe and bucket_id = 'worker-photos';
end
$$;

select * from pg_temp.why_storage();

-- If "rules allowing an upload to it" said NONE, the rules were never written,
-- and the likeliest reason is that the SQL editor's role may not write them:
-- storage.objects belongs to Storage, not to this database's owner, and the
-- attempt is reported as a notice rather than an error, which is easy to miss.
--
-- Two rules written in the dashboard cover every bucket, and take a minute:
--
--   Storage, Policies, New policy on storage.objects, For full customization
--     name:        staff_everything
--     allowed:     SELECT, INSERT, UPDATE, DELETE
--     target role: authenticated
--     USING and WITH CHECK expression, both:   ops.is_staff()
--
--   Storage, Policies, New policy on storage.objects, For full customization
--     name:        website_reads_published
--     allowed:     SELECT
--     target role: anon, authenticated
--     USING expression:   bucket_id in ('published-photos', 'published-cvs')
--
-- Then run this file again: the last row should read ACCEPTED.
