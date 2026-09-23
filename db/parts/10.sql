-- Eleutheria schema, part 10 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

create trigger staff_guard_self before update on ops.staff
  for each row execute function ops.guard_own_account();

-- --------------------------------------------------- the public website ---

-- What eleutheria.agency is allowed to see: enough to present a worker, and
-- nothing that identifies her beyond it. Date of birth is reduced to an age,
-- and passport, identity, phone and every financial column are simply absent.
--
-- The view runs with its owner's rights (security_invoker stays off), which is
-- how an anonymous caller reads it while ops.applicants itself stays locked.
-- That is the point of the view, and the reason the column list is explicit
-- rather than select *: adding a sensitive column to applicants later must not
-- silently publish it.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'published_workers' and table_type = 'BASE TABLE'
  ) then
    raise exception 'public.published_workers already exists as a table. Rename it or change this view''s name before running this migration.';
  end if;
end
$$;

create or replace view public.published_workers as
  select
    a.id,
    a.english_name,
    a.arabic_name,
    a.gender,
    extract(year from age(a.dob))::int as age,
    a.country,
    a.profession,
    a.type,
    a.experience_years,
    a.photo_path,
    a.updated_at
  from ops.applicants a
  where a.published_to_website
    and a.status = 'Available';

comment on view public.published_workers is
  'Public projection for eleutheria.agency. Add columns here deliberately: anything listed becomes world readable.';

grant select on public.published_workers to anon, authenticated;
