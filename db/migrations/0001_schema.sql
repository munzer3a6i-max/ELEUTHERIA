-- Eleutheria operations database.
--
-- Everything the dashboard owns lives in its own schema, `ops`. The website
-- already has tables in `public`, and this migration must not touch, rename or
-- shadow any of them: a separate schema makes that a guarantee rather than a
-- promise. The only thing added to `public` is one read-only view, in
-- 0002_security.sql, which is what the website reads.
--
-- Mirrors src/types/index.ts. Nested arrays in the front-end model become
-- child tables here so they can be queried and constrained.
--
-- Bilingual values are two columns, not JSON: the app sorts and filters on
-- them, and a column is cheaper to index than a JSON path.
--
-- Money is numeric(12,2). Never float: 0.1 + 0.2 must equal 0.3 in a ledger.

create schema if not exists ops;

-- ---------------------------------------------------------------- helpers --

create or replace function ops.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------- reference --

create table if not exists ops.countries (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists ops.cities (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references ops.countries (id) on delete cascade,
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists ops.professions (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists ops.payment_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- 'Invoices' and/or 'Request Status'
  scopes      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- One row, enforced by the check constraint.
create table if not exists ops.settings (
  id              boolean primary key default true check (id),
  company_name    text not null default 'Eleutheria',
  company_tagline text not null default 'International Placement Services',
  license_number  text not null default '',
  address         text not null default '',
  currency        text not null default 'USD',
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- people --

-- An account. `user_id` is the Supabase auth user; a row without one is a
-- person on the payroll who cannot sign in. The role here is the same role the
-- interface uses, and from now on it is the database that enforces it.
create table if not exists ops.staff (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique,
  username    text not null unique check (username = lower(username)),
  name_en     text not null,
  name_ar     text not null default '',
  phone       text not null default '',
  email       text not null default '',
  role        text not null default 'data_entry'
                check (role in ('admin', 'accountant', 'data_entry')),
  status      text not null default 'Active'
                check (status in ('Active', 'Inactive', 'Suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column ops.staff.user_id is
  'The Supabase auth user. Passwords live in auth.users and never here.';

-- The partner office abroad that a domestic worker comes through.
create table if not exists ops.agencies (
  id                   uuid primary key default gen_random_uuid(),
  english_name         text not null,
  arabic_name          text not null default '',
  license_number       text not null default '',
  license_expiry       date,
  phone                text not null default '',
  email                text not null default '',
  telephone            text not null default '',
  rating               smallint not null default 0 check (rating between 0 and 5),
  primary_manager_en   text not null default '',
  primary_manager_ar   text not null default '',
  second_manager_en    text not null default '',
  second_manager_ar    text not null default '',
  status               text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- A person who introduces candidates one at a time and earns on each one that
-- gets through.
create table if not exists ops.agents (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null,
  name_ar         text not null default '',
  phone           text not null default '',
  email           text not null default '',
  area            text not null default '',
  status          text not null default 'Active' check (status in ('Active', 'Inactive')),
  selection_fee   numeric(12,2) not null default 0 check (selection_fee >= 0),
  deployment_fee  numeric(12,2) not null default 0 check (deployment_fee >= 0),
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists ops.employers (
  id                          uuid primary key default gen_random_uuid(),
  english_name                text not null,
  arabic_name                 text not null default '',
  email                       text not null default '',
  phone                       text not null default '',
  telephone                   text not null default '',
  national_address            text not null default '',
  national_id_number          text not null default '',
  national_address_short_code text not null default '',
  profile_image_path          text,
  status                      text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

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

-- ------------------------------------------------------------ placements --

create table if not exists ops.requests (
  id                       uuid primary key default gen_random_uuid(),
  type                     text not null check (type in ('Domestic', 'Profession')),
  contract_duration_months smallint not null default 24,
  applicant_id             uuid not null references ops.applicants (id) on delete restrict,
  employer_id              uuid not null references ops.employers (id) on delete restrict,
  responsible_staff_id     uuid references ops.staff (id) on delete set null,
  agency_id                uuid references ops.agencies (id) on delete set null,
  mosaned_number           text not null default '',
  notes_en                 text not null default '',
  notes_ar                 text not null default '',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- The stage log. Reaching a stage is what creates an agent's commission, a
-- partner office's charge and a backout, so this table is the origin of most
-- of the money below it.
create table if not exists ops.request_status_history (
  id                    uuid primary key default gen_random_uuid(),
  request_id            uuid not null references ops.requests (id) on delete cascade,
  status                text not null,
  occurred_on           date not null,
  cost                  numeric(12,2) not null default 0 check (cost >= 0),
  payment_source_id     uuid references ops.payment_sources (id) on delete set null,
  responsible_staff_id  uuid references ops.staff (id) on delete set null,
  attachment_path       text,
  attachment_name       text,
  attachment_type       text,
  attachment_size       integer,
  notes                 text not null default '',
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------- money ---

create table if not exists ops.invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  request_id     uuid references ops.requests (id) on delete set null,
  employer_id    uuid not null references ops.employers (id) on delete restrict,
  agency_id      uuid references ops.agencies (id) on delete set null,
  service_price  numeric(12,2) not null check (service_price >= 0),
  status         text not null default 'Issued'
                   check (status in ('Issued', 'Partial Payment', 'Completed')),
  issued_on      date not null default current_date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists ops.invoice_payments (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references ops.invoices (id) on delete cascade,
  paid_on           date not null,
  amount            numeric(12,2) not null check (amount > 0),
  payment_source_id uuid references ops.payment_sources (id) on delete set null,
  attachment_path   text,
  attachment_name   text,
  attachment_type   text,
  attachment_size   integer,
  created_at        timestamptz not null default now()
);

create table if not exists ops.payroll_entries (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid not null references ops.staff (id) on delete cascade,
  -- First day of the month the entry covers.
  period          date not null,
  basic_salary    numeric(12,2) not null default 0 check (basic_salary >= 0),
  overtime        numeric(12,2) not null default 0 check (overtime >= 0),
  allowances      numeric(12,2) not null default 0 check (allowances >= 0),
  status          text not null default 'Pending' check (status in ('Paid', 'Pending')),
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (staff_id, period)
);

create table if not exists ops.office_expenses (
  id              uuid primary key default gen_random_uuid(),
  item_en         text not null,
  item_ar         text not null default '',
  category        text not null default '',
  amount          numeric(12,2) not null check (amount >= 0),
  spent_on        date not null,
  status          text not null default 'Paid' check (status in ('Paid', 'Pending')),
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- What a partner office pays for each domestic worker placed with them.
create table if not exists ops.agency_contracts (
  id               uuid primary key default gen_random_uuid(),
  agency_id        uuid not null references ops.agencies (id) on delete cascade,
  reference        text not null default '',
  price_per_worker numeric(12,2) not null check (price_per_worker >= 0),
  signed_on        date,
  expires_on       date,
  status           text not null default 'Active' check (status in ('Active', 'Expired')),
  notes            text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Half of that price falls due at selection, half when the visa is issued.
-- One row per request and milestone, which is what makes the app's re-sync
-- idempotent.
create table if not exists ops.agency_charges (
  id                uuid primary key default gen_random_uuid(),
  agency_id         uuid not null references ops.agencies (id) on delete cascade,
  contract_id       uuid references ops.agency_contracts (id) on delete set null,
  applicant_id      uuid not null references ops.applicants (id) on delete cascade,
  request_id        uuid not null references ops.requests (id) on delete cascade,
  milestone         text not null check (milestone in ('Selected', 'Visa Issued')),
  amount            numeric(12,2) not null check (amount >= 0),
  due_on            date not null,
  status            text not null default 'Pending' check (status in ('Pending', 'Paid')),
  settled_on        date,
  payment_source_id uuid references ops.payment_sources (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (request_id, milestone)
);

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
create index if not exists ops_requests_employer_id_idx on ops.requests (employer_id);
create index if not exists ops_requests_agency_id_idx on ops.requests (agency_id);
create index if not exists ops_request_status_history_request_id_occurred_on_idx on ops.request_status_history (request_id, occurred_on);
create index if not exists ops_invoices_employer_id_idx on ops.invoices (employer_id);
create index if not exists ops_invoices_agency_id_idx on ops.invoices (agency_id);
create index if not exists ops_invoice_payments_invoice_id_idx on ops.invoice_payments (invoice_id);
create index if not exists ops_payroll_entries_period_idx on ops.payroll_entries (period);
create index if not exists ops_office_expenses_spent_on_idx on ops.office_expenses (spent_on);
create index if not exists ops_agency_contracts_agency_id_idx on ops.agency_contracts (agency_id);
create index if not exists ops_agency_charges_agency_id_status_idx on ops.agency_charges (agency_id, status);
create index if not exists ops_agent_commissions_agent_id_status_idx on ops.agent_commissions (agent_id, status);
create index if not exists ops_backout_costs_backout_id_idx on ops.backout_costs (backout_id);
create index if not exists ops_notifications_staff_id_read_at_idx on ops.notifications (staff_id, read_at);

-- ------------------------------------------------------------- triggers ---

drop trigger if exists staff_updated on ops.staff;
create trigger staff_updated before update on ops.staff for each row execute function ops.set_updated_at();
drop trigger if exists agencies_updated on ops.agencies;
create trigger agencies_updated before update on ops.agencies for each row execute function ops.set_updated_at();
drop trigger if exists agents_updated on ops.agents;
create trigger agents_updated before update on ops.agents for each row execute function ops.set_updated_at();
drop trigger if exists employers_updated on ops.employers;
create trigger employers_updated before update on ops.employers for each row execute function ops.set_updated_at();
drop trigger if exists applicants_updated on ops.applicants;
create trigger applicants_updated before update on ops.applicants for each row execute function ops.set_updated_at();
drop trigger if exists requests_updated on ops.requests;
create trigger requests_updated before update on ops.requests for each row execute function ops.set_updated_at();
drop trigger if exists invoices_updated on ops.invoices;
create trigger invoices_updated before update on ops.invoices for each row execute function ops.set_updated_at();
drop trigger if exists payroll_updated on ops.payroll_entries;
create trigger payroll_updated before update on ops.payroll_entries for each row execute function ops.set_updated_at();
drop trigger if exists office_exp_updated on ops.office_expenses;
create trigger office_exp_updated before update on ops.office_expenses for each row execute function ops.set_updated_at();
drop trigger if exists contracts_updated on ops.agency_contracts;
create trigger contracts_updated before update on ops.agency_contracts for each row execute function ops.set_updated_at();
drop trigger if exists charges_updated on ops.agency_charges;
create trigger charges_updated before update on ops.agency_charges for each row execute function ops.set_updated_at();
drop trigger if exists commissions_updated on ops.agent_commissions;
create trigger commissions_updated before update on ops.agent_commissions for each row execute function ops.set_updated_at();
drop trigger if exists backouts_updated on ops.backouts;
create trigger backouts_updated before update on ops.backouts for each row execute function ops.set_updated_at();
drop trigger if exists settings_updated on ops.settings;
create trigger settings_updated before update on ops.settings for each row execute function ops.set_updated_at();
