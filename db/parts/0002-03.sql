-- 0002_security.sql, piece 3 of 3.
-- Run the pieces in order, each on its own. Running one twice is safe.

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

-- The projection the website reads lives in 0007_public_projection.sql, which
-- owns all of it: the function that does the reading, the view over it, and
-- the one policy that lets it through. It is kept in one file because those
-- three pieces only make sense together, and splitting them was how a single
-- well-meant change in the Supabase dashboard took the website down.
