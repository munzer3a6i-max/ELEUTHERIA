-- 0001_schema.sql, piece 6 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- Half an agent's fee at selection, the other half at deployment.
create table if not exists ops.agent_commissions (
  id                uuid primary key default gen_random_uuid(),
  agent_id          uuid not null references ops.agents (id) on delete cascade,
  applicant_id      uuid not null references ops.applicants (id) on delete cascade,
  request_id        uuid not null references ops.requests (id) on delete cascade,
  milestone         text not null check (milestone in ('Selected', 'Deployed')),
  amount            numeric(12,2) not null check (amount >= 0),
  earned_on         date not null,
  status            text not null default 'Pending' check (status in ('Pending', 'Paid')),
  paid_on           date,
  payment_source_id uuid references ops.payment_sources (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (request_id, milestone)
);

-- A worker who pulled out. Inside the guarantee window the company brings her
-- home at its own expense, which is what backout_costs records.
create table if not exists ops.backouts (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references ops.requests (id) on delete cascade unique,
  applicant_id  uuid not null references ops.applicants (id) on delete cascade,
  deployed_on   date,
  returned_on   date not null,
  reason        text not null default '',
  liability     text not null default 'Company'
                  check (liability in ('Company', 'Employer', 'Agency')),
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists ops.backout_costs (
  id                uuid primary key default gen_random_uuid(),
  backout_id        uuid not null references ops.backouts (id) on delete cascade,
  label_en          text not null,
  label_ar          text not null default '',
  category          text not null default '',
  amount            numeric(12,2) not null check (amount >= 0),
  spent_on          date not null,
  status            text not null default 'Pending' check (status in ('Pending', 'Paid')),
  payment_source_id uuid references ops.payment_sources (id) on delete set null,
  attachment_path   text,
  attachment_name   text,
  attachment_type   text,
  attachment_size   integer,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------- personal ---

create table if not exists ops.notifications (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid references ops.staff (id) on delete cascade,
  title       text not null,
  detail      text not null default '',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------- indexes ---

create index if not exists ops_cities_country_id_idx on ops.cities (country_id);

create index if not exists ops_applicants_agency_id_idx on ops.applicants (agency_id);

create index if not exists ops_applicants_agent_id_idx on ops.applicants (agent_id);

create index if not exists ops_applicants_status_idx on ops.applicants (status);

create index if not exists ops_applicants_published_to_website_partial_idx on ops.applicants (published_to_website) where published_to_website;

create index if not exists ops_applicant_experience_applicant_id_idx on ops.applicant_experience (applicant_id);

create index if not exists ops_applicant_education_applicant_id_idx on ops.applicant_education (applicant_id);

create index if not exists ops_applicant_documents_applicant_id_idx on ops.applicant_documents (applicant_id);

create index if not exists ops_applicant_notes_applicant_id_idx on ops.applicant_notes (applicant_id);

create index if not exists ops_requests_applicant_id_idx on ops.requests (applicant_id);
