-- File storage.
--
-- Three private buckets, because none of what they hold is public:
--
--   worker-photos     the photograph on a worker's profile
--   worker-documents  CVs, passport copies, anything attached to an applicant
--   bills             the receipt behind a payment, an expense or a backout
--
-- The website shows photographs of published workers, but it does so by asking
-- its own server for a signed URL, which keeps every unpublished worker's
-- photograph out of reach. A public bucket would publish all of them.
--
-- Run this after creating the three buckets in Storage, or let the inserts
-- below create them.

insert into storage.buckets (id, name, public)
values
  ('worker-photos', 'worker-photos', false),
  ('worker-documents', 'worker-documents', false),
  ('bills', 'bills', false)
on conflict (id) do nothing;

-- Staff read and write; nobody else reaches the buckets at all. Who may see a
-- bill is decided by the table that points at it, which is already locked to
-- the roles that may read finance.
do $$
declare b text;
begin
  foreach b in array array['worker-photos', 'worker-documents', 'bills']
  loop
    execute format(
      'create policy %I on storage.objects for select to authenticated using (bucket_id = %L and ops.is_staff())',
      b || '_read', b);
    execute format(
      'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and ops.is_staff())',
      b || '_write', b);
    execute format(
      'create policy %I on storage.objects for update to authenticated using (bucket_id = %L and ops.is_staff()) with check (bucket_id = %L and ops.is_staff())',
      b || '_update', b, b);
    execute format(
      'create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and ops.is_staff())',
      b || '_delete', b);
  end loop;
end
$$;
