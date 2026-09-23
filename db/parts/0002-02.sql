-- 0002_security.sql, piece 2 of 4.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
