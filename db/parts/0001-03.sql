-- 0001_schema.sql, piece 3 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

create table if not exists ops.applicants (
  id                     uuid primary key default gen_random_uuid(),
  english_name           text not null,
  arabic_name            text not null default '',
  gender                 text not null check (gender in ('Male', 'Female')),
  dob                    date,
  country                text not null default '',
  profession             text not null default '',
  type                   text not null default 'Domestic' check (type in ('Domestic', 'Profession')),
  experience_years       smallint not null default 0,
  passport_no            text not null default '',
  passport_start         date,
  passport_end           date,
  id_number              text not null default '',
  phone                  text not null default '',
  telephone              text not null default '',
  status                 text not null default 'Available'
                           check (status in ('Available', 'Unavailable', 'Selected', 'Deployed', 'Back Out')),
  photo_path             text,
  -- The standing photograph the bio data prints beside her details.
  full_body_path         text,
  cv_path                text,
  -- The name the office uploaded, beside the uuid the file is stored under.
  cv_file_name           text,
  -- Everything a CV needs that running a placement does not: religion,
  -- languages, what she is asking for. Optional, and read by name.
  cv_details             jsonb not null default '{}'::jsonb,
  passport_copy_path     text,
  passport_copy_file_name text,
  -- The switch that decides whether this worker appears on the public site.
  published_to_website   boolean not null default false,
  agency_id              uuid references ops.agencies (id) on delete set null,
  agent_id               uuid references ops.agents (id) on delete set null,
  -- Whose worker she is. Null for a worker nobody has claimed, and for the
  -- tradesmen, who do not come through a manager at all.
  manager_id             uuid references ops.managers (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             uuid references ops.staff (id) on delete set null
);

create table if not exists ops.applicant_experience (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references ops.applicants (id) on delete cascade,
  title         text not null,
  employer      text not null default '',
  years         smallint not null default 0,
  -- What she actually did there, and where. Both are columns in the CV.
  duties        text not null default '',
  country       text not null default ''
);

create table if not exists ops.applicant_education (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references ops.applicants (id) on delete cascade,
  degree        text not null,
  institution   text not null default '',
  year          text not null default ''
);

create table if not exists ops.applicant_documents (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references ops.applicants (id) on delete cascade,
  name          text not null,
  category      text not null default '',
  storage_path  text,
  uploaded_at   timestamptz not null default now()
);

create table if not exists ops.applicant_notes (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references ops.applicants (id) on delete cascade,
  author_id     uuid references ops.staff (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);
