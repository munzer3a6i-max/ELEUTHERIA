-- Eleutheria schema, part 8 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

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
