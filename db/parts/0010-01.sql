-- 0010_cv_and_bonus.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The CV, and what payroll calls the extra.
--
-- A worker's record holds what the office needs to run a placement. A CV needs
-- more than that -- religion, languages, what she can use, what she is asking
-- for -- and none of it is worth a column of its own, because the template
-- will change and these are all optional free text. So they travel together as
-- one document on her record, and the CV page reads them by name.
--
-- Payroll's `overtime` becomes `bonus`: the office does not pay by the hour,
-- it adds something to a month's pay when it chooses to. The column is renamed
-- rather than added so nothing already entered is lost.

alter table ops.applicants add column if not exists cv_details jsonb not null default '{}'::jsonb;

-- What she did in a job, which the CV's experience table asks for by name.
alter table ops.applicant_experience add column if not exists duties text not null default '';

-- Where the job was. The bio data's employment table is a list of countries.
alter table ops.applicant_experience add column if not exists country text not null default '';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'ops' and table_name = 'payroll_entries' and column_name = 'overtime'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'ops' and table_name = 'payroll_entries' and column_name = 'bonus'
  ) then
    execute 'alter table ops.payroll_entries rename column overtime to bonus';
    execute 'alter table ops.payroll_entries rename constraint payroll_entries_overtime_check to payroll_entries_bonus_check';
  end if;
exception when undefined_object then
  -- The check constraint is named by Postgres and an older database may call
  -- it something else. The rename that matters is the column's.
  null;
end
$$;
