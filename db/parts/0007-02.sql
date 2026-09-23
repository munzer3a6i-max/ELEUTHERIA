-- 0007_public_projection.sql, piece 2 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

create or replace function ops.published_workers_rows()
returns table (
  id               uuid,
  english_name     text,
  arabic_name      text,
  gender           text,
  age              int,
  country          text,
  profession       text,
  type             text,
  experience_years smallint,
  photo_path       text,
  cv_path          text,
  updated_at       timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id,
    a.english_name,
    a.arabic_name,
    a.gender,
    extract(year from age(a.dob))::int,
    a.country,
    a.profession,
    a.type,
    a.experience_years,
    a.photo_path,
    a.cv_path,
    a.updated_at
  from ops.applicants a
  where a.published_to_website
    and a.status = 'Available';
$$;

comment on function ops.published_workers_rows() is
  'The public projection for eleutheria.agency. Add columns here deliberately: anything returned becomes world readable.';

-- Nobody runs this by accident: the grant is named, not inherited from public.
revoke all on function ops.published_workers_rows() from public;

grant usage on schema ops to anon;

grant execute on function ops.published_workers_rows() to anon, authenticated;

-- Handed over last, so that the revoke and the grants above are made by the
-- role that still owns it at the time.
alter function ops.published_workers_rows() owner to ops_website_reader;

-- A view rather than an rpc endpoint, so the website keeps reading a table-
-- shaped thing it can filter and order in the ordinary way.
drop view if exists public.published_workers;

create view public.published_workers
  with (security_invoker = true)
  as select * from ops.published_workers_rows();

comment on view public.published_workers is
  'Public projection for eleutheria.agency. The columns come from ops.published_workers_rows(); change them there.';

grant select on public.published_workers to anon, authenticated;
