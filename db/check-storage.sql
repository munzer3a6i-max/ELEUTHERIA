-- Why an upload is refused.
--
-- Supabase answers several different refusals with the same "400 Bad Request",
-- so the console cannot tell them apart. These three tables can.
--
-- 1. THE BUCKETS. A missing one is created by the migration named beside it.
--    file_size_limit and allowed_mime_types are usually null; if something set
--    them in the dashboard, a perfectly good photograph can be refused for
--    being the wrong type or too large.

select
  v.name as bucket,
  case when b.id is null then 'MISSING — run ' || v.made_by else 'present' end as state,
  case when b.public then 'public' else 'private' end as visibility,
  b.file_size_limit,
  b.allowed_mime_types
from (values
  ('worker-photos',    '0003_storage.sql'),
  ('worker-documents', '0003_storage.sql'),
  ('bills',            '0003_storage.sql'),
  ('published-photos', '0005_published_photos.sql'),
  ('published-cvs',    '0006_published_cvs.sql')
) as v(name, made_by)
left join storage.buckets b on b.id = v.name
order by v.name;

-- 2. THE RULES ON THE FILES THEMSELVES. storage.objects has row level security
--    on, so with no policy for a bucket every upload is refused -- which is
--    reported as a bad request rather than as a refusal. Expect four rows for
--    each private bucket (read, write, update, delete) and four for each
--    public one.

select
  split_part(polname, '_', 1) as names_bucket,
  polname                     as policy,
  case polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update' when 'd' then 'delete' else polcmd::text end as command
from pg_policy
where polrelid = 'storage.objects'::regclass
order by polname;

-- 3. WHO THE DATABASE THINKS IS STAFF. The storage rules ask ops.is_staff(),
--    which answers yes only for an active staff row pointing at the account
--    signing in. A row with no user_id is the usual reason an upload is
--    refused while everything else on the screen works.

select username, role, status,
       case when user_id is null then 'NOT LINKED — Settings, Users, Link sign-in accounts' else 'linked' end as account
from ops.staff
order by username;
