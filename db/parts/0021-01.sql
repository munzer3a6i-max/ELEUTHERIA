-- 0021_lead_documents_storage.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The document an employer sends with an enquiry: a job order, a requirements
-- sheet. It lives in a private bucket of its own, because leads belong to the
-- super administrators alone and the worker buckets are open to all staff.
--
-- Additive and re-runnable.

insert into storage.buckets (id, name, public)
values ('lead-documents', 'lead-documents', false)
on conflict (id) do nothing;

drop policy if exists "lead-documents_read"   on storage.objects;
drop policy if exists "lead-documents_write"  on storage.objects;
drop policy if exists "lead-documents_update" on storage.objects;
drop policy if exists "lead-documents_delete" on storage.objects;

create policy "lead-documents_read" on storage.objects for select to authenticated
  using (bucket_id = 'lead-documents' and ops.is_super_admin());
create policy "lead-documents_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'lead-documents' and ops.is_super_admin());
create policy "lead-documents_update" on storage.objects for update to authenticated
  using (bucket_id = 'lead-documents' and ops.is_super_admin())
  with check (bucket_id = 'lead-documents' and ops.is_super_admin());
create policy "lead-documents_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'lead-documents' and ops.is_super_admin());
