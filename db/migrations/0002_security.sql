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

-- ---------------------------------------------------------- the policies --

-- Reference data and the staff list: everyone signed in needs to read these to
-- fill a dropdown or name the person who handled a request. Only an
-- administrator changes them.
do $$
declare t text;
begin
  foreach t in array array['countries', 'cities', 'professions', 'payment_sources', 'staff', 'settings']
  loop
    execute format('drop policy if exists read_all_staff on ops.%I', t);
    execute format('drop policy if exists write_admin on ops.%I', t);
    execute format('drop policy if exists update_admin on ops.%I', t);
    execute format('drop policy if exists delete_admin on ops.%I', t);
    execute format('create policy read_all_staff on ops.%I for select to authenticated using (ops.is_staff())', t);
    execute format('create policy write_admin on ops.%I for insert to authenticated with check (ops.is_admin())', t);
    execute format('create policy update_admin on ops.%I for update to authenticated using (ops.is_admin()) with check (ops.is_admin())', t);
    execute format('create policy delete_admin on ops.%I for delete to authenticated using (ops.is_admin())', t);
  end loop;
end
$$;

-- The caseload.
do $$
declare t text;
begin
  foreach t in array array[
    'employers', 'agencies', 'agents', 'applicants', 'applicant_experience',
    'applicant_education', 'applicant_documents', 'applicant_notes',
    'requests', 'request_status_history'
  ]
  loop
    execute format('drop policy if exists read_all_staff on ops.%I', t);
    execute format('drop policy if exists write_operations on ops.%I', t);
    execute format('drop policy if exists update_operations on ops.%I', t);
    execute format('drop policy if exists delete_operations on ops.%I', t);
    execute format('create policy read_all_staff on ops.%I for select to authenticated using (ops.is_staff())', t);
    execute format('create policy write_operations on ops.%I for insert to authenticated with check (ops.can_write_operations())', t);
    execute format('create policy update_operations on ops.%I for update to authenticated using (ops.can_write_operations()) with check (ops.can_write_operations())', t);
    execute format('create policy delete_operations on ops.%I for delete to authenticated using (ops.can_write_operations())', t);
  end loop;
end
$$;

-- The money. Data entry cannot even read these, which is what the finance
-- pages being absent from their sidebar has meant all along.
do $$
declare t text;
begin
  foreach t in array array[
    'invoices', 'invoice_payments', 'payroll_entries', 'office_expenses',
    'agency_contracts', 'agency_charges', 'agent_commissions',
    'backouts', 'backout_costs'
  ]
  loop
    execute format('drop policy if exists read_finance on ops.%I', t);
    execute format('drop policy if exists write_finance on ops.%I', t);
    execute format('drop policy if exists update_finance on ops.%I', t);
    execute format('drop policy if exists delete_finance on ops.%I', t);
    execute format('create policy read_finance on ops.%I for select to authenticated using (ops.can_read_finance())', t);
    execute format('create policy write_finance on ops.%I for insert to authenticated with check (ops.can_write_finance())', t);
    execute format('create policy update_finance on ops.%I for update to authenticated using (ops.can_write_finance()) with check (ops.can_write_finance())', t);
    execute format('create policy delete_finance on ops.%I for delete to authenticated using (ops.can_write_finance())', t);
  end loop;
end
$$;

-- Payroll is what colleagues earn, so it is the administrator's alone --
-- narrower than the rest of finance, and deliberately so.
drop policy if exists read_finance   on ops.payroll_entries;
drop policy if exists write_finance  on ops.payroll_entries;
drop policy if exists update_finance on ops.payroll_entries;
drop policy if exists delete_finance on ops.payroll_entries;
drop policy if exists read_admin     on ops.payroll_entries;
drop policy if exists write_admin    on ops.payroll_entries;
drop policy if exists update_admin   on ops.payroll_entries;
drop policy if exists delete_admin   on ops.payroll_entries;
create policy read_admin   on ops.payroll_entries for select to authenticated using (ops.is_admin());
create policy write_admin  on ops.payroll_entries for insert to authenticated with check (ops.is_admin());
create policy update_admin on ops.payroll_entries for update to authenticated using (ops.is_admin()) with check (ops.is_admin());
create policy delete_admin on ops.payroll_entries for delete to authenticated using (ops.is_admin());

-- A notice addressed to somebody is theirs; one addressed to nobody is for the
-- whole office.
drop policy if exists read_own on ops.notifications;
create policy read_own on ops.notifications for select to authenticated
  using (ops.is_staff() and (staff_id is null or staff_id in (select id from ops.staff where user_id = auth.uid())));
drop policy if exists write_own on ops.notifications;
create policy write_own on ops.notifications for insert to authenticated
  with check (ops.is_staff());
drop policy if exists update_own on ops.notifications;
create policy update_own on ops.notifications for update to authenticated
  using (ops.is_staff() and (staff_id is null or staff_id in (select id from ops.staff where user_id = auth.uid())))
  with check (ops.is_staff());
drop policy if exists delete_own on ops.notifications;
create policy delete_own on ops.notifications for delete to authenticated
  using (ops.is_staff() and (staff_id is null or staff_id in (select id from ops.staff where user_id = auth.uid())));

-- Nobody may hand themselves a role or reactivate their own suspended account,
-- administrator or not: that is the one edit that could quietly undo all of
-- the above.
create or replace function ops.guard_own_account() returns trigger
language plpgsql security definer set search_path = ops, pg_temp as $$
begin
  if new.user_id is not distinct from auth.uid()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'You cannot change your own role or status.';
  end if;
  return new;
end;
$$;

drop trigger if exists staff_guard_self on ops.staff;
create trigger staff_guard_self before update on ops.staff
  for each row execute function ops.guard_own_account();

-- --------------------------------------------------- the public website ---

-- What eleutheria.agency is allowed to see: enough to present a worker, and
-- nothing that identifies her beyond it. Date of birth is reduced to an age,
-- and passport, identity, phone and every financial column are simply absent.
--
-- The view runs with its owner's rights (security_invoker stays off), which is
-- how an anonymous caller reads it while ops.applicants itself stays locked.
-- That is the point of the view, and the reason the column list is explicit
-- rather than select *: adding a sensitive column to applicants later must not
-- silently publish it.
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

create or replace view public.published_workers as
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
    a.updated_at
  from ops.applicants a
  where a.published_to_website
    and a.status = 'Available';

comment on view public.published_workers is
  'Public projection for eleutheria.agency. Add columns here deliberately: anything listed becomes world readable.';

grant select on public.published_workers to anon, authenticated;
