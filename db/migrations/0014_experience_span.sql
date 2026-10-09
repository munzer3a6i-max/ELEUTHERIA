-- The years she was there.
--
-- The office types a range -- 2021 to 2023 -- because that is what her
-- passport, her contract and her own memory say. The count of years is worked
-- out from it rather than typed a second time and disagreed with, so `years`
-- stays exactly what it was and everything reading it, the website's cards
-- included, is untouched.
--
-- Null on an entry recorded before the range existed, which is why neither
-- column is required: a job somebody logged as "4 years" and nothing else is
-- still a job she did.

alter table ops.applicant_experience add column if not exists from_year smallint;
alter table ops.applicant_experience add column if not exists to_year   smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applicant_experience_span_sane'
  ) then
    alter table ops.applicant_experience add constraint applicant_experience_span_sane
      check (
        (from_year is null or from_year between 1950 and 2100)
        and (to_year is null or to_year between 1950 and 2100)
        and (from_year is null or to_year is null or to_year >= from_year)
      );
  end if;
end
$$;

comment on column ops.applicant_experience.from_year is
  'The year the job started. Null on an entry recorded before the range existed.';
