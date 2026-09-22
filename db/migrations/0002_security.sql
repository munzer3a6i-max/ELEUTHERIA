-- Access rules.
--
-- Two audiences exist:
--   * signed-in staff, who may read and write operational data
--   * the public website, which may read a curated projection and nothing else
--
-- Every table is locked by default. Nothing is readable without a policy.

alter table countries            enable row level security;
alter table cities               enable row level security;
alter table professions          enable row level security;
alter table payment_sources      enable row level security;
alter table staff                enable row level security;
alter table agencies             enable row level security;
alter table employers            enable row level security;
alter table applicants           enable row level security;
alter table applicant_experience enable row level security;
alter table applicant_education  enable row level security;
alter table applicant_documents  enable row level security;
alter table applicant_notes      enable row level security;
alter table requests             enable row level security;
alter table request_status_history enable row level security;
alter table invoices             enable row level security;
alter table invoice_payments     enable row level security;
alter table payroll_entries      enable row level security;
alter table office_expenses      enable row level security;
alter table notifications        enable row level security;
alter table settings             enable row level security;

-- Is the caller a staff member who has not been deactivated?
create or replace function is_active_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff
    where user_id = auth.uid() and status = 'Active'
  );
$$;

-- Payroll is salary data about colleagues, so it is administrators only.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff
    where user_id = auth.uid() and status = 'Active' and role = 'admin'
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'countries', 'cities', 'professions', 'payment_sources', 'staff', 'agencies',
    'employers', 'applicants', 'applicant_experience', 'applicant_education',
    'applicant_documents', 'applicant_notes', 'requests', 'request_status_history',
    'invoices', 'invoice_payments', 'office_expenses', 'notifications', 'settings'
  ]
  loop
    execute format(
      'create policy staff_all on %I for all to authenticated using (is_active_staff()) with check (is_active_staff())',
      t
    );
  end loop;
end
$$;

create policy payroll_admin_only on payroll_entries
  for all to authenticated using (is_admin()) with check (is_admin());

-- --------------------------------------------------- the public website ---

-- What eleutheria.agency is allowed to see: enough to present a worker,
-- and nothing that identifies them beyond it. Date of birth is reduced to
-- an age, and passport, identity, phone and every financial column are
-- simply absent from the projection.
--
-- The view runs with the owner's rights (security_invoker is left off), so
-- it can read the locked applicants table on behalf of an anonymous caller.
-- That is the point of the view, and the reason its column list is explicit
-- rather than select *: adding a sensitive column to applicants later must
-- not silently publish it.
create view published_workers as
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
  from applicants a
  where a.published_to_website
    and a.status = 'Available';

comment on view published_workers is
  'Public projection for the website. Add columns here deliberately: anything listed becomes world readable.';

grant select on published_workers to anon;
