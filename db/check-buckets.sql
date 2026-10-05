-- Which file buckets this project actually has.
--
-- Uploading a photograph answers with a plain "400 Bad Request" when the
-- bucket is missing, which reads as though the file were at fault. It is not.
-- This says plainly what is there and what is not.
--
-- Expect five: three private (worker-photos, worker-documents, bills) and two
-- public (published-photos, published-cvs). Anything missing is created by the
-- migration named beside it.

select
  v.name                                               as bucket,
  case when b.id is null then 'MISSING — run ' || v.made_by else 'present' end as state,
  coalesce(case when b.public then 'public' else 'private' end, '—')           as visibility,
  coalesce((select count(*)::text from storage.objects o where o.bucket_id = b.id), '—') as files
from (values
  ('worker-photos',    'private', '0003_storage.sql'),
  ('worker-documents', 'private', '0003_storage.sql'),
  ('bills',            'private', '0003_storage.sql'),
  ('published-photos', 'public',  '0005_published_photos.sql'),
  ('published-cvs',    'public',  '0006_published_cvs.sql')
) as v(name, want, made_by)
left join storage.buckets b on b.id = v.name
order by v.name;
