-- 0002_security.sql, piece 1 of 4.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- Who can read and write what.
--
-- The application already sorts every screen and every action into an area --
-- finance, operations, system, personal -- and gives each role a list it may
-- read and a list it may change. Until now those rules lived only in the
-- browser, where anyone who opens the developer tools can edit them. Here they
-- become the database's rules, which is the real point of the move:
--
--   admin       reads and writes everything
--   accountant  writes finance, reads operations and the reference data
--   data_entry  writes operations, and cannot read finance at all
--   anon        reads one view of published workers, and nothing else
--
-- Every table is locked by default. Nothing is readable without a policy.

-- ------------------------------------------------------------- who am i ---

-- The signed-in caller's role, or null when they are not active staff.
-- security definer so it can read ops.staff while ops.staff is itself locked.
create or replace function ops.current_role() returns text
language sql stable security definer set search_path = ops, pg_temp as $$
  select role from ops.staff where user_id = auth.uid() and status = 'Active';
$$;

create or replace function ops.is_staff() returns boolean
language sql stable as $$ select ops.current_role() is not null $$;

create or replace function ops.is_admin() returns boolean
language sql stable as $$ select ops.current_role() = 'admin' $$;

-- Reading the money: the accountant's job, and the administrator's.
create or replace function ops.can_read_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'accountant') $$;

create or replace function ops.can_write_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'accountant') $$;

-- Working the caseload: data entry's job, and the administrator's. An
-- accountant reads it -- the money makes no sense without it -- but does not
-- change it.
create or replace function ops.can_write_operations() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'data_entry') $$;

-- --------------------------------------------------------------- grants ---

-- PostgREST reaches the schema through these roles; RLS below decides the
-- rest. `anon` is given nothing here on purpose: the website's key can see the
-- published_workers view at the bottom of this file and not one row more.
grant usage on schema ops to authenticated;

grant select, insert, update, delete on all tables in schema ops to authenticated;

alter default privileges in schema ops grant select, insert, update, delete on tables to authenticated;

-- --------------------------------------------------------- lock it all ----

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'ops'
  loop
    execute format('alter table ops.%I enable row level security', t);
    execute format('alter table ops.%I force row level security', t);
  end loop;
end
$$;
