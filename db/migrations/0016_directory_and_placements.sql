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

-- What this file leaves behind, as the last thing on screen.
select tablename as table_name,
       policyname as policy,
       cmd as applies_to
  from pg_policies
 where schemaname = 'ops'
   and tablename in ('applicants', 'requests')
 order by tablename, cmd, policyname;
