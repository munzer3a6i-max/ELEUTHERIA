-- Run this whole file once in the Supabase SQL editor.
--
-- It is the three migrations the dashboard is waiting for, in order. All of it
-- is additive: it adds columns and replaces two functions, and it does not
-- change, move or delete a single row you already have. Running it twice is
-- safe.
--
--   1. Who the database thinks is signed in   (fixes the refused uploads)
--   2. The office's website, phones and email (the CV letterhead)
--   3. The years a job ran, from and to       (the experience entries)
--
-- Nothing else here needs doing afterwards. The catch-up file is separate on
-- purpose, because that one wants reading before it is run.

-- ===== 1 of 3 — who the database thinks is signed in -----------------------------

-- Who is signed in, however the question is asked.
--
-- Every rule in this database turns on ops.is_staff(), which turns on
-- auth.uid(), which reads the signed-in account out of a setting the server
-- puts on the connection before it runs anything.
--
-- The catch is that there is more than one server. PostgREST, which the
-- dashboard's queries go through, sets request.jwt.claims. Storage, which
-- uploads go through, has set request.jwt.claim.sub as well, and older
-- projects' auth.uid() reads only one of the two. When the one it reads is
-- the one that service did not set, auth.uid() is null, the caller looks like
-- a stranger, and the upload is refused with a row level security error --
-- while every other screen in the dashboard works, because its queries come
-- in through the service that does set the setting auth.uid() reads.
--
-- So the identity is resolved here instead, from whichever of the two is
-- present. It is still the signed-in account and nothing else: both settings
-- are put there by the server out of a verified token, and neither can be set
-- by anybody calling in.

create or replace function ops.caller_uid() returns uuid
language plpgsql stable as $$
declare sub text;
begin
  -- Whatever the project's own auth.uid() manages first, since that is what
  -- the rest of Supabase agrees on.
  begin
    sub := auth.uid()::text;
  exception when others then
    sub := null;
  end;
  if sub is not null then return sub::uuid; end if;

  sub := nullif(current_setting('request.jwt.claim.sub', true), '');
  if sub is null then
    begin
      sub := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
    exception when others then
      sub := null;
    end;
  end if;

  begin
    return sub::uuid;
  exception when others then
    return null;
  end;
end
$$;

-- The one line that changes: the caller's id now comes from the function
-- above rather than from auth.uid() alone.
create or replace function ops.current_role() returns text
language sql stable security definer set search_path = ops, pg_temp as $$
  select role from ops.staff where user_id = ops.caller_uid() and status = 'Active';
$$;


-- ===== 2 of 3 — the office on the CV letterhead ----------------------------------

-- How to reach the office, on the document itself.
--
-- The CV's letterhead prints the licence number and, under it, the line
-- somebody holding the document rings: the website and the agency's numbers.
-- They were part of the template from the start and had no home in the
-- database, so they are three columns on the one settings row rather than
-- something typed into the page by hand each time.

alter table ops.settings add column if not exists website text not null default 'eleutheria.agency';
alter table ops.settings add column if not exists phones  text not null default 'PH +63 961 278 0038 · PH +63 960 401 4714';
alter table ops.settings add column if not exists email   text not null default 'info@eleutheria.agency';

comment on column ops.settings.phones is
  'Printed on the CV letterhead as written, so the separators and country prefixes are the office''s choice.';


-- ===== 3 of 3 — the years a job ran ----------------------------------------------

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

