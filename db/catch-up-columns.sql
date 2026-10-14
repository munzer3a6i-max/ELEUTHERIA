-- Every column the dashboard writes that a migration added after the first.
--
-- A database installed from an early copy of the schema and then only partly
-- caught up ends up a column or two short, and the dashboard says so one save
-- at a time: "Could not find the 'country' column of 'applicant_experience'".
-- This file is the whole list in one place. Every statement is "add column if
-- not exists", so a column already there is left exactly as it is, and the
-- file can be run as often as you like.
--
-- It ends by telling the API to re-read the schema and by printing which of
-- these columns, if any, are still missing -- which should be none.

-- --- 0009/0010: managers, and what the CV asks for -------------------------
alter table ops.applicants add column if not exists manager_id uuid references ops.managers (id) on delete set null;
alter table ops.applicants add column if not exists cv_details jsonb not null default '{}'::jsonb;
alter table ops.applicants add column if not exists cv_file_name text;
alter table ops.applicant_experience add column if not exists duties  text not null default '';
alter table ops.applicant_experience add column if not exists country text not null default '';

-- --- 0011: the pictures on the CV ------------------------------------------
alter table ops.applicants add column if not exists full_body_path text;
alter table ops.applicants add column if not exists passport_copy_file_name text;

-- --- 0013: the office's own contact line -----------------------------------
alter table ops.settings add column if not exists website text not null default 'eleutheria.agency';
alter table ops.settings add column if not exists phones  text not null default 'PH +63 961 278 0038 · PH +63 960 401 4714';
alter table ops.settings add column if not exists email   text not null default 'info@eleutheria.agency';

-- --- 0014: the years a job ran ---------------------------------------------
alter table ops.applicant_experience add column if not exists from_year smallint;
alter table ops.applicant_experience add column if not exists to_year   smallint;

-- --- 0018: the peso rate ---------------------------------------------------
alter table ops.settings add column if not exists peso_rate numeric(10,4) not null default 56.5;

-- PostgREST reloads its picture of the schema only when told.
notify pgrst, 'reload schema';

-- What is still missing, if anything. "none" is the answer you want.
with expected (table_name, column_name) as (
  values
    ('applicants', 'manager_id'), ('applicants', 'cv_details'), ('applicants', 'cv_file_name'),
    ('applicants', 'full_body_path'), ('applicants', 'passport_copy_file_name'),
    ('applicant_experience', 'duties'), ('applicant_experience', 'country'),
    ('applicant_experience', 'from_year'), ('applicant_experience', 'to_year'),
    ('settings', 'website'), ('settings', 'phones'), ('settings', 'email'), ('settings', 'peso_rate'),
    ('status_definitions', 'id')
)
select coalesce(string_agg(e.table_name || '.' || e.column_name, ', ' order by e.table_name, e.column_name), 'none')
         as still_missing
  from expected e
  left join information_schema.columns c
    on c.table_schema = 'ops' and c.table_name = e.table_name and c.column_name = e.column_name
 where c.column_name is null;
