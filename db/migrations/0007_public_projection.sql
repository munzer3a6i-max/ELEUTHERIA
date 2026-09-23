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
--   * the function belongs to a role of its own, ops_website_reader, which
--     cannot log in and exists for this one job. A single policy on
--     ops.applicants lets that role read a published, available row and
--     nothing else. Row level security is forced on that table, and forced
--     means forced, so without the policy even the owner's rights read
--     nothing -- and because the policy names this role alone, a signed-in
--     stranger gains nothing from it.
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

-- The role the reading is done as. It cannot log in, holds nothing but the one
-- grant below, and exists so that the permission to read published rows can be
-- given to a job rather than to a person or to everybody.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'ops_website_reader') then
    create role ops_website_reader nologin noinherit;
  end if;
end
$$;

-- Owning a function means being able to hand it over: on some versions the
-- creator is an administrator of the role it just made, on others the
-- membership has to be asked for. Either way this is a no-op the second time.
do $$
begin
  execute format('grant ops_website_reader to %I', current_user);
exception when others then
  null;
end
$$;

grant usage on schema ops to ops_website_reader;
grant select on ops.applicants to ops_website_reader;

-- A published, available worker may be read -- by this role, and by no other.
-- Every other policy on this table is `to authenticated`, and this one stays
-- out of their way: a signed-in stranger with no staff row still reads nothing.
drop policy if exists website_published_read on ops.applicants;
create policy website_published_read on ops.applicants
  for select to ops_website_reader
  using (published_to_website and status = 'Available');

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

-- Handed over last, so that the revoke and the grants above are made by the
-- role that still owns it at the time.
alter function ops.published_workers_rows() owner to ops_website_reader;

-- A view rather than an rpc endpoint, so the website keeps reading a table-
-- shaped thing it can filter and order in the ordinary way.
drop view if exists public.published_workers;

create view public.published_workers
  with (security_invoker = true)
  as select * from ops.published_workers_rows();

comment on view public.published_workers is
  'Public projection for eleutheria.agency. The columns come from ops.published_workers_rows(); change them there.';

grant select on public.published_workers to anon, authenticated;
