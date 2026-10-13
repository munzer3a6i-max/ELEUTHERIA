-- Run this whole file once in the Supabase SQL editor.
--
-- It is the two migrations the dashboard is waiting for, in order. Both are
-- additive: they widen the list of roles a staff row may hold, add one table
-- for the stages of the recruitment, and rewrite who may write what. Not a
-- single row of your data is changed, moved or deleted. Running it twice is
-- safe, and running it again after the first part is safe too.
--
--   1. The super administrator, and the stages as data
--   2. The directories and the placements, told apart
--
-- Part 1 promotes Maan and Elmunzer Abdelkarim by name. If a name is spelled
-- differently in your staff list, edit the WHERE clause there before running --
-- or run the file, read the staff list it prints, and fix it with:
--
--   update ops.staff set role = 'super_admin' where username = 'theirusername';
--
-- An office with nobody holding that role cannot hand it out again, so check
-- the printed list before closing the editor.

-- ===== 1 of 2 =============================================================

-- The super administrator, and the stages as data.
--
-- Two offices had grown into one role. Running the office -- the caseload and
-- the money -- is one job; deciding who may sign in, what the lists hold and
-- what the stages of a recruitment are is another, and it is the one that can
-- hand itself out. They are separate roles now:
--
--   super_admin  everything, and the only one who may write the System tables.
--   admin        the whole caseload and the whole of the money, nothing more.
--
-- Nothing already stored changes meaning: an existing administrator keeps
-- every power they had except the System pages, and the promotion to
-- super_admin is a one-line update at the bottom of this file.
--
-- Re-runnable, like every migration here.

-- ------------------------------------------------------------- the role ---

alter table ops.staff drop constraint if exists staff_role_check;
alter table ops.staff add constraint staff_role_check
  check (role in ('super_admin', 'admin', 'accountant', 'data_entry'));

create or replace function ops.is_super_admin() returns boolean
language sql stable as $$ select ops.current_role() = 'super_admin' $$;

-- Everywhere that already said "administrator" keeps meaning it, with the
-- super administrator counted in: they can do anything an administrator can.
create or replace function ops.is_admin() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin') $$;

create or replace function ops.can_read_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'accountant') $$;

create or replace function ops.can_write_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'accountant') $$;

create or replace function ops.can_write_operations() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'data_entry') $$;

-- --------------------------------------------------------- the stages -----

-- The stages of each pipeline. They were compiled into the app, which meant
-- adding one needed a developer; they are rows now, and the Statuses page
-- writes them. A stage already logged against a placement keeps its label in
-- that log whatever happens here: the log records what was done, not what the
-- list says today.
create table if not exists ops.status_definitions (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  pipeline      text not null check (pipeline in ('Domestic', 'Profession', 'Invoice')),
  step_order    smallint not null default 0,
  default_cost  numeric(12,2) not null default 0 check (default_cost >= 0),
  cost_note     text not null default '',
  is_terminal   boolean not null default false,
  is_exception  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists ops_status_definitions_pipeline_order_idx
  on ops.status_definitions (pipeline, step_order);

-- PostgREST keeps its own picture of the schema and only reloads it when told.
-- A table it has not heard of is "not found in the schema cache", which reaches
-- the dashboard as a save that will not go through, so say it out loud here
-- rather than leaving somebody to wonder.
notify pgrst, 'reload schema';

-- ------------------------------------------------- who writes the system ---

-- Reading stays as it was: everyone signed in needs these to fill a dropdown
-- or name a stage. Writing is the super administrator's alone -- hiding the
-- page stops an honest mistake, refusing the write stops the rest.
do $$
declare t text;
begin
  foreach t in array array['countries', 'cities', 'professions', 'managers', 'expense_categories',
                           'payment_sources', 'staff', 'settings', 'status_definitions']
  loop
    execute format('alter table ops.%I enable row level security', t);
    execute format('alter table ops.%I force row level security', t);
    execute format('drop policy if exists read_all_staff on ops.%I', t);
    execute format('drop policy if exists write_admin on ops.%I', t);
    execute format('drop policy if exists update_admin on ops.%I', t);
    execute format('drop policy if exists delete_admin on ops.%I', t);
    execute format('drop policy if exists write_super on ops.%I', t);
    execute format('drop policy if exists update_super on ops.%I', t);
    execute format('drop policy if exists delete_super on ops.%I', t);
    execute format('create policy read_all_staff on ops.%I for select to authenticated using (ops.is_staff())', t);
    execute format('create policy write_super on ops.%I for insert to authenticated with check (ops.is_super_admin())', t);
    execute format('create policy update_super on ops.%I for update to authenticated using (ops.is_super_admin()) with check (ops.is_super_admin())', t);
    execute format('create policy delete_super on ops.%I for delete to authenticated using (ops.is_super_admin())', t);
  end loop;
end
$$;

grant select, insert, update, delete on ops.status_definitions to authenticated;

-- ------------------------------------------- nobody is the unknown user ----

-- The guard that stops somebody handing themselves a role compared the row
-- being written with the signed-in account using "is not distinct from", which
-- treats two unknowns as the same person: a staff row with no account linked to
-- it yet matched a caller with no account -- the SQL editor, among others --
-- and so its role could never be changed at all. A caller who is nobody is not
-- the person on the row; the rule is otherwise exactly as it was.
create or replace function ops.guard_own_account() returns trigger
language plpgsql security definer set search_path = ops, pg_temp as $$
begin
  if auth.uid() is not null
     and new.user_id = auth.uid()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'You cannot change your own role or status.';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------ the two of them ----

-- Promote by name, and only where the account is real: an office with nobody
-- holding this role can never hand it out again. Edit the names if yours are
-- spelled differently, or run it again after adding the person.
update ops.staff
   set role = 'super_admin'
 where status = 'Active'
   and (
     lower(name_en) like '%maan%'
     or lower(name_en) like '%munzer%'
     or lower(name_en) like '%abdelkarim%'
     or lower(coalesce(email, '')) like '%munzer%'
   );

-- What this file did, as the last thing on screen.
select name_en as staff, role, status
  from ops.staff
 order by (role = 'super_admin') desc, name_en;


-- ===== 2 of 2 =============================================================

-- Two halves of the caseload, and deleting as its own right.
--
-- "The caseload" was one thing to this database: the four directories the
-- office keeps -- workers, employers, partner offices, agents -- and the
-- recruitment itself, the requests and their stage log. Data entry could write
-- all of it, and delete all of it.
--
-- The office wanted those apart. Data entry keeps the directories: they add
-- somebody and correct what is on file. They do not open placements, and they
-- delete nothing at all -- a wrong entry is corrected, not removed. So:
--
--   directories  insert and update by data entry, an administrator or a super
--                administrator; delete by the administrators.
--   placements   administrators only, in and out.
--
-- Reading is untouched: everybody signed in still reads both, which is what
-- lets a worker's file show the placement she is on.
--
-- Re-runnable, like every migration here. Nothing is moved or deleted.

create or replace function ops.can_write_directory() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'data_entry') $$;

create or replace function ops.can_write_placements() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin') $$;

-- Removing a record is not part of changing one. This is the whole difference
-- between the two roles on the pages they share.
create or replace function ops.can_delete_caseload() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin') $$;

-- ------------------------------------------------------- the directories ---

do $$
declare t text;
begin
  foreach t in array array[
    'employers', 'agencies', 'agents', 'applicants', 'applicant_experience',
    'applicant_education', 'applicant_documents', 'applicant_notes'
  ]
  loop
    execute format('drop policy if exists read_all_staff on ops.%I', t);
    execute format('drop policy if exists write_operations on ops.%I', t);
    execute format('drop policy if exists update_operations on ops.%I', t);
    execute format('drop policy if exists delete_operations on ops.%I', t);
    execute format('create policy read_all_staff on ops.%I for select to authenticated using (ops.is_staff())', t);
    execute format('create policy write_operations on ops.%I for insert to authenticated with check (ops.can_write_directory())', t);
    execute format('create policy update_operations on ops.%I for update to authenticated using (ops.can_write_directory()) with check (ops.can_write_directory())', t);
    execute format('create policy delete_operations on ops.%I for delete to authenticated using (ops.can_delete_caseload())', t);
  end loop;
end
$$;

-- -------------------------------------------------------- the placements ---

do $$
declare t text;
begin
  foreach t in array array['requests', 'request_status_history']
  loop
    execute format('drop policy if exists read_all_staff on ops.%I', t);
    execute format('drop policy if exists write_operations on ops.%I', t);
    execute format('drop policy if exists update_operations on ops.%I', t);
    execute format('drop policy if exists delete_operations on ops.%I', t);
    execute format('create policy read_all_staff on ops.%I for select to authenticated using (ops.is_staff())', t);
    execute format('create policy write_operations on ops.%I for insert to authenticated with check (ops.can_write_placements())', t);
    execute format('create policy update_operations on ops.%I for update to authenticated using (ops.can_write_placements()) with check (ops.can_write_placements())', t);
    execute format('create policy delete_operations on ops.%I for delete to authenticated using (ops.can_write_placements())', t);
  end loop;
end
$$;

-- New policies are read straight from the catalogue, but the API's picture of
-- the schema is reloaded on request only.
notify pgrst, 'reload schema';

-- What this file leaves behind, as the last thing on screen.
select tablename as table_name,
       policyname as policy,
       cmd as applies_to
  from pg_policies
 where schemaname = 'ops'
   and tablename in ('applicants', 'requests')
 order by tablename, cmd, policyname;
