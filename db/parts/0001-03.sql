-- 0001_schema.sql, piece 3 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- Passport and identity numbers live here and are never exposed publicly.
-- See the published_workers view in 0002_security.sql.
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
  cv_path                text,
  -- The name the office uploaded, beside the uuid the file is stored under.
  cv_file_name           text,
  passport_copy_path     text,
  -- The switch that decides whether this worker appears on the public site.
  published_to_website   boolean not null default false,
  agency_id              uuid references ops.agencies (id) on delete set null,
  agent_id               uuid references ops.agents (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             uuid references ops.staff (id) on delete set null
);

create table if not exists ops.applicant_experience (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references ops.applicants (id) on delete cascade,
  title         text not null,
  employer      text not null default '',
  years         smallint not null default 0
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
