-- 0007_public_projection.sql, piece 2 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

create policy website_published_read on ops.applicant_experience
  for select to public
  using (
    current_user not in ('anon', 'authenticated')
    and exists (
      select 1 from ops.applicants a
       where a.id = applicant_id
         and a.published_to_website
         and a.status = 'Available'
    )
  );

-- Dropped rather than replaced, because a function's returns list cannot be
-- changed in place and this one grows whenever the site is given something
-- more to show. The view goes first: it depends on the function.
drop view if exists public.published_workers;

drop function if exists ops.published_workers_rows();

create function ops.published_workers_rows()
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
  experience       jsonb,
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
    -- The office records experience twice over: a total on the record, and the
    -- jobs themselves. Whichever says more is the one to show, so listing three
    -- jobs is enough on its own and so is typing a total without listing any.
    greatest(a.experience_years, coalesce(worked.total, 0))::smallint,
    coalesce(worked.jobs, '[]'::jsonb),
    a.photo_path,
    a.cv_path,
    a.updated_at
  from ops.applicants a
  left join lateral (
    select
      sum(x.years)::int as total,
      -- The employer is deliberately left out. For a domestic worker that is
      -- usually a household, and naming somebody else's family on a public
      -- page is not this page's business. What she did, and for how long, is.
      jsonb_agg(
        jsonb_build_object('title', x.title, 'years', x.years)
        order by x.years desc, x.title
      ) as jobs
    from ops.applicant_experience x
    where x.applicant_id = a.id
  ) worked on true
  where a.published_to_website
    and a.status = 'Available';
$$;

comment on function ops.published_workers_rows() is
  'The public projection for eleutheria.agency. Add columns here deliberately: anything returned becomes world readable.';

-- Nobody runs this by accident: the grant is named, not inherited from public.
revoke all on function ops.published_workers_rows() from public;

grant usage on schema ops to anon;

grant execute on function ops.published_workers_rows() to anon, authenticated;

-- A view rather than an rpc endpoint, so the website keeps reading a table-
-- shaped thing it can filter and order in the ordinary way.
create view public.published_workers
  with (security_invoker = true)
  as select * from ops.published_workers_rows();

comment on view public.published_workers is
  'Public projection for eleutheria.agency. The columns come from ops.published_workers_rows(); change them there.';

grant select on public.published_workers to anon, authenticated;
