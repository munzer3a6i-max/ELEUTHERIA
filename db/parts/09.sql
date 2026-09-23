-- Eleutheria schema, part 9 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

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
