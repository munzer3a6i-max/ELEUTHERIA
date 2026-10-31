-- 0022_accountant_payroll.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The accountant runs the payroll.
--
-- 0002 kept the payroll to the administrators alone, narrower than the rest of
-- finance. The office has since given the payroll to its accountant: the
-- Payroll page is on her menu, and she pays the salaries. So the payroll now
-- follows the same rule as every other finance table -- the administrators
-- and the accountant read and change it, and data entry still cannot see it.
--
-- Only the rules change. Not a row is touched. Re-runnable.

drop policy if exists read_admin     on ops.payroll_entries;

drop policy if exists write_admin    on ops.payroll_entries;

drop policy if exists update_admin   on ops.payroll_entries;

drop policy if exists delete_admin   on ops.payroll_entries;

drop policy if exists read_finance   on ops.payroll_entries;

drop policy if exists write_finance  on ops.payroll_entries;

drop policy if exists update_finance on ops.payroll_entries;

drop policy if exists delete_finance on ops.payroll_entries;

create policy read_finance   on ops.payroll_entries for select to authenticated using (ops.can_read_finance());

create policy write_finance  on ops.payroll_entries for insert to authenticated with check (ops.can_write_finance());

create policy update_finance on ops.payroll_entries for update to authenticated using (ops.can_write_finance()) with check (ops.can_write_finance());

create policy delete_finance on ops.payroll_entries for delete to authenticated using (ops.can_write_finance());

notify pgrst, 'reload schema';

select count(*) as payroll_entries_on_file from ops.payroll_entries;
