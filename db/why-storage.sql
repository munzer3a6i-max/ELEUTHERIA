-- Why is the upload refused?
--
-- Paste this whole file into the SQL editor and read the table it returns.
-- Each row is one step of what Storage does when the dashboard uploads a
-- photograph, in order, with the answer the database actually gives. The
-- first row that reads badly is the cause.
--
-- Every step stands on its own: one that cannot be answered says so in its
-- own row rather than taking the rest of the table down with it. So the table
-- always arrives, and it does not matter which of the migrations have been run
-- or in what order.
--
-- It changes nothing: the one row it writes to test the rules is deleted
-- again before the file ends, and no file is uploaded anywhere.

create or replace function pg_temp.why_storage() returns table (step text, answer text)
language plpgsql as $$
declare
  uid uuid;
  probe text;
  n int;
  v text;
begin
  -- 1. Does the bucket exist, and will it take a picture?
  begin
    select case when b.id is null then 'MISSING — run db/fix-storage.sql'
                else 'present, ' || case when b.public then 'public' else 'private' end
                  || ', ' || coalesce('size limit ' || b.file_size_limit::text, 'no size limit')
                  || ', ' || coalesce('only ' || b.allowed_mime_types::text, 'any type')
           end
      into v
      from (select 'worker-photos' as id) want
      left join storage.buckets b on b.id = want.id;
  exception when others then
    v := 'could not be read: ' || sqlerrm;
  end;
  step := 'the worker-photos bucket'; answer := coalesce(v, 'MISSING — run db/fix-storage.sql'); return next;

  -- 2. Is there a rule that lets anybody upload to it at all? With none,
  --    every upload is refused, and Storage reports a bad request.
  begin
    select count(*) into n
    from pg_policy p
    where p.polrelid = 'storage.objects'::regclass
      and p.polcmd in ('a', '*')
      and pg_get_expr(coalesce(p.polwithcheck, p.polqual), p.polrelid) like '%worker-photos%';
    v := case when n = 0
           then 'NONE — this alone refuses every upload. See the note at the end of this file.'
           else n::text || ' (enough)' end;
  exception when others then
    v := 'could not be read: ' || sqlerrm;
  end;
  step := 'rules allowing an upload to it'; answer := v; return next;

  -- 3. Is there an account to test with?
  begin
    select s.user_id, s.username into uid, v
    from ops.staff s where s.status = 'Active' and s.user_id is not null
    order by s.username limit 1;
    if uid is null then
      v := 'none — no active staff row points at a sign-in account. Settings, Users, Link sign-in accounts.';
    end if;
  exception when others then
    v := 'could not be read: ' || sqlerrm;
  end;
  step := 'testing as'; answer := v; return next;
  if uid is null then return; end if;

  -- 4. The chain the rules walk, with the settings Storage puts on the
  --    connection rather than the ones PostgREST puts there.
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid::text, true);

  begin
    v := coalesce(auth.uid()::text, 'NOTHING — this project''s auth.uid() does not read the setting Storage sets');
  exception when others then
    v := 'could not be asked: ' || sqlerrm;
  end;
  step := 'auth.uid() sees'; answer := v; return next;

  -- Asked by name and run by name, so a project that has not had
  -- 0012_caller_identity.sql yet gets a sentence instead of an error.
  if to_regprocedure('ops.caller_uid()') is null then
    v := 'that function does not exist yet — run db/parts/0012-01.sql';
  else
    begin
      execute 'select coalesce(ops.caller_uid()::text, ''NOTHING — the setting it reads is not set either'')' into v;
    exception when others then
      v := 'could not be asked: ' || sqlerrm;
    end;
  end if;
  step := 'ops.caller_uid() sees'; answer := v; return next;

  begin
    v := case when (select ops.is_staff()) then 'yes' else 'NO — so every rule refuses this account' end;
  exception when others then
    v := 'could not be asked: ' || sqlerrm;
  end;
  step := 'ops.is_staff() answers'; answer := v; return next;

  -- 5. The upload itself, as the role Storage uses.
  probe := 'diagnostic/' || gen_random_uuid() || '.png';
  begin
    execute 'set local role authenticated';
    begin
      insert into storage.objects (bucket_id, name, owner) values ('worker-photos', probe, uid);
      v := 'ACCEPTED — uploads should work now';
    exception when others then
      v := 'REFUSED: ' || sqlerrm;
    end;
    execute 'reset role';
  exception when others then
    begin execute 'reset role'; exception when others then null; end;
    v := 'could not be tried: ' || sqlerrm;
  end;
  step := 'an upload to worker-photos'; answer := v; return next;

  begin
    delete from storage.objects where name = probe and bucket_id = 'worker-photos';
  exception when others then null;
  end;
end
$$;

-- Last statement in the file on purpose: the SQL editor shows the result of
-- the last one that returns rows, which is why a file of several queries looks
-- as though only its final table ran.
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
