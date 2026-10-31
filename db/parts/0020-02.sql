-- 0020_lead_records.sql, piece 2 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

drop policy if exists write_super  on ops.lead_activities;

drop policy if exists update_super on ops.lead_activities;

drop policy if exists delete_super on ops.lead_activities;

create policy read_super   on ops.lead_activities for select to authenticated using (ops.is_super_admin());

create policy write_super  on ops.lead_activities for insert to authenticated with check (ops.is_super_admin());

create policy update_super on ops.lead_activities for update to authenticated using (ops.is_super_admin()) with check (ops.is_super_admin());

create policy delete_super on ops.lead_activities for delete to authenticated using (ops.is_super_admin());

grant select, insert, update, delete on ops.lead_activities to authenticated;

notify pgrst, 'reload schema';

select count(*) as leads_on_file, min(ref_no) as first_reference, max(ref_no) as last_reference from ops.leads;
