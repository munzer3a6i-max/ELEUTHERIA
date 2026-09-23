-- What the website is allowed to see, and how it is allowed to see it.
--
-- The rule has not changed: enough to present a worker and nothing that
-- identifies her beyond it. Date of birth is reduced to an age; passport,
-- identity, phone and every financial column are simply absent.
--
-- How it is served has changed, because the first arrangement invited its own
-- undoing. A plain view in `public` reading a locked table runs with its
-- owner's rights, and Supabase's database linter reports that as a security
-- definer view -- correctly, as a description, and misleadingly as a warning,
-- since running with the owner's rights is the entire point. Accepting the
-- linter's offered fix sets security_invoker on, the anonymous caller loses
-- the owner's rights along with it, and the website goes dark.
--
-- So the pieces are arranged to leave nothing for anyone to fix:
--
--   * a function does the reading. It is security definer, which is where the
--     borrowed rights now live, and its search_path is pinned so the name
--     ops.applicants cannot be made to mean anything else.
--   * one policy lets the role that function runs as -- whoever owns it, which
--     is whoever runs this file -- read a published, available row. Row level
--     security is forced on ops.applicants, and forced means forced, so
--     without the policy even an owner reads nothing. The policy excludes
--     `anon` and `authenticated` by name, so a signed-in stranger with no
--     staff row still gains nothing from it.
--   * the view is security_invoker, so the linter has nothing to say. The
--     anonymous caller needs no rights on any table -- only permission to run
--     the function, which decides for itself what comes back.
--
-- The upshot is that `anon` is granted nothing on ops.applicants, here or
-- anywhere, and the twelve columns below are the whole of what the internet
-- can reach.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'published_workers' and table_type = 'BASE TABLE'
  ) then
    raise exception 'public.published_workers already exists as a table. Rename it or change this view''s name before running this migration.';
  end if;
end
$$;

-- An earlier draft of this file gave the reading its own role and handed the
-- function over to it. That is tidier on paper and needs privileges the
-- Supabase SQL editor does not have: transferring ownership requires the new
-- owner to hold CREATE on the schema, which is refused for anyone but a
-- superuser. Clear away what that draft left behind, if it ran.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'ops_website_reader') then
    execute 'revoke all on ops.applicants from ops_website_reader';
    execute 'revoke all on schema ops from ops_website_reader';
    execute 'drop owned by ops_website_reader';
    execute 'drop role ops_website_reader';
  end if;
exception when others then
  -- Leaving a role with no privileges behind is untidy, never dangerous, and
  -- not worth failing this file over.
  null;
end
$$;

-- A published, available worker may be read by the role this file's function
-- runs as, and by nobody who signs in through the application: `anon` and
-- `authenticated` are named out of it, so the caseload stays behind the
-- policies in 0002_security.sql for everyone who reaches it that way.
drop policy if exists website_published_read on ops.applicants;
create policy website_published_read on ops.applicants
  for select to public
  using (
    published_to_website
    and status = 'Available'
    and current_user not in ('anon', 'authenticated')
  );

create or replace function ops.published_workers_rows()
returns table (
  id               uuid,
  english_name     text,
  arabic_name      text,
  gender           text,
  age              int,
  country          text,
  profession       text,
  type             text,
  experience_years smallint,
  photo_path       text,
  cv_path          text,
  updated_at       timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id,
    a.english_name,
    a.arabic_name,
    a.gender,
    extract(year from age(a.dob))::int,
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
$$;

comment on function ops.published_workers_rows() is
  'The public projection for eleutheria.agency. Add columns here deliberately: anything returned becomes world readable.';

-- Nobody runs this by accident: the grant is named, not inherited from public.
revoke all on function ops.published_workers_rows() from public;
grant usage on schema ops to anon;
grant execute on function ops.published_workers_rows() to anon, authenticated;

-- A view rather than an rpc endpoint, so the website keeps reading a table-
-- shaped thing it can filter and order in the ordinary way.
drop view if exists public.published_workers;

create view public.published_workers
  with (security_invoker = true)
  as select * from ops.published_workers_rows();

comment on view public.published_workers is
  'Public projection for eleutheria.agency. The columns come from ops.published_workers_rows(); change them there.';

grant select on public.published_workers to anon, authenticated;
