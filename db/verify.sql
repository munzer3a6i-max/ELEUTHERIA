-- Did it all land?
--
-- One statement, on purpose: the SQL editor shows the result of the last one
-- only, so anything split across several queries hides its own answer.
--
-- A paste that gets cut off leaves a database that looks fine until something
-- is missing months later, so this names what did not arrive rather than just
-- counting.

with expected(name) as (
  values
    ('agencies'), ('agency_charges'), ('agency_contracts'), ('agent_commissions'),
    ('agents'), ('applicant_documents'), ('applicant_education'), ('applicant_experience'),
    ('applicant_notes'), ('applicants'), ('backout_costs'), ('backouts'), ('cities'),
    ('countries'), ('employers'), ('invoice_payments'), ('invoices'), ('notifications'),
    ('office_expenses'), ('payment_sources'), ('payroll_entries'), ('professions'),
    ('request_status_history'), ('requests'), ('settings'), ('staff')
),
found as (select tablename as name from pg_tables where schemaname = 'ops'),
missing as (select name from expected except select name from found),
counted as (
  select
    (select count(*) from found)                                as tables_found,
    (select count(*) from expected)                             as tables_expected,
    (select count(*) from pg_policies where schemaname = 'ops') as policies_found,
    (select count(*) from missing)                              as missing_count,
    (select count(*) from pg_views
      where schemaname = 'public' and viewname = 'published_workers') as website_view,
    (select count(*) from pg_trigger t
       join pg_class c on c.oid = t.tgrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'ops' and t.tgname = 'staff_guard_self')  as self_guard
  from (select 1) _
)
select
  tables_found || ' of ' || tables_expected                     as tables,
  policies_found || ' of 104'                                   as access_rules,
  case when website_view = 1 then 'yes' else 'MISSING' end      as website_view,
  case when self_guard = 1 then 'yes' else 'MISSING' end        as self_role_guard,
  coalesce((select string_agg(name, ', ' order by name) from missing), 'none') as tables_missing,
  case
    when missing_count > 0
      then 'INCOMPLETE — the tables named above did not arrive. Run those parts again; every one is safe to re-run.'
    when policies_found < 104
      then 'TABLES OK, ACCESS RULES INCOMPLETE — run parts 08 to 10 again.'
    when website_view = 0
      then 'ALMOST — the published_workers view is missing. Run part 10 again.'
    when self_guard = 0
      then 'ALMOST — the guard that stops anyone changing their own role is missing. Run part 10 again.'
    else 'OK — everything landed. Next: Project Settings, API, Exposed schemas, add ops beside public.'
  end                                                           as verdict
from counted;
