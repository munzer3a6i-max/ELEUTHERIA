-- Did it all land?
--
-- Run this last. A paste that gets cut off mid-way leaves a database that
-- looks fine until something is missing months later, so this names anything
-- that did not arrive rather than just counting.

with expected(name) as (
  values
    ('agencies'), ('agency_charges'), ('agency_contracts'), ('agent_commissions'),
    ('agents'), ('applicant_documents'), ('applicant_education'), ('applicant_experience'),
    ('applicant_notes'), ('applicants'), ('backout_costs'), ('backouts'), ('cities'),
    ('countries'), ('employers'), ('invoice_payments'), ('invoices'), ('notifications'),
    ('office_expenses'), ('payment_sources'), ('payroll_entries'), ('professions'),
    ('request_status_history'), ('requests'), ('settings'), ('staff')
),
found as (select tablename as name from pg_tables where schemaname = 'ops')
select
  (select count(*) from found)                                    as tables_found,
  (select count(*) from expected)                                 as tables_expected,
  (select count(*) from pg_policies where schemaname = 'ops')     as policies_found,
  104                                                             as policies_expected,
  coalesce((select string_agg(name, ', ' order by name)
              from (select name from expected except select name from found) missing),
           'none')                                                as tables_missing,
  case
    when (select count(*) from (select name from expected except select name from found) m) > 0
      then 'INCOMPLETE — the tables listed above are missing. Run the parts again; every one is safe to re-run.'
    when (select count(*) from pg_policies where schemaname = 'ops') < 104
      then 'TABLES OK, RULES INCOMPLETE — run the later parts again.'
    when (select count(*) from pg_views where schemaname = 'public' and viewname = 'published_workers') = 0
      then 'ALMOST — the published_workers view is missing. Run the last of the non-storage parts again.'
    else 'OK — everything landed. Next: Project Settings, API, Exposed schemas, add ops.'
  end                                                             as verdict;

-- And what the website will be able to read (no rows yet is correct):
select count(*) as workers_the_website_can_see from public.published_workers;
