-- 0007_public_projection.sql, piece 1 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
