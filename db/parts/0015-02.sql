-- 0015_super_admin.sql, piece 2 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
