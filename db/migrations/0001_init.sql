-- Eleutheria operations database.
--
-- Mirrors the application's types in src/types/index.ts. Nested arrays in the
-- front-end model (experience, documents, status history, invoice payments)
-- become child tables here so they can be queried and constrained.
--
-- Bilingual values are stored as two columns rather than JSON: the app sorts
-- and filters on them, and a column is cheaper to index than a JSON path.
--
-- Money is numeric(12,2). Never float: 0.1 + 0.2 must equal 0.3 in a ledger.

-- gen_random_uuid() is core Postgres since 13, so no extension is needed.

-- ---------------------------------------------------------------- helpers --

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------ reference ---

create table countries (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table cities (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references countries (id) on delete cascade,
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table professions (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table payment_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- 'Invoices' and/or 'Request Status'
  scopes      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- people --

-- Staff rows link to Supabase auth users. A row with a null user_id is a
-- person on the payroll who cannot sign in.
create table staff (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique,
  name_en     text not null,
  name_ar     text not null default '',
  phone       text not null default '',
  email       text not null default '',
  role        text not null default 'user' check (role in ('admin', 'user')),
  status      text not null default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table agencies (
  id               uuid primary key default gen_random_uuid(),
  english_name     text not null,
  arabic_name      text not null default '',
  license_number   text not null default '',
  license_expiry   date,
  phone            text not null default '',
  email            text not null default '',
  telephone        text not null default '',
  rating           smallint not null default 0 check (rating between 0 and 5),
  primary_manager_en   text not null default '',
  primary_manager_ar   text not null default '',
  second_manager_en    text not null default '',
  second_manager_ar    text not null default '',
  country          text not null default '',
  currency         text not null default '',
  status           text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table employers (
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
-- See the published_workers view at the bottom of this file.
create table applicants (
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
                           check (status in ('Available', 'Unavailable', 'Selected', 'Deployed')),
  photo_path             text,
  cv_path                text,
  passport_copy_path     text,
  -- The switch that decides whether this worker appears on the public site.
  published_to_website   boolean not null default false,
  agency_id              uuid references agencies (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             uuid references staff (id) on delete set null
);

create table applicant_experience (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references applicants (id) on delete cascade,
  title         text not null,
  employer      text not null default '',
  years         smallint not null default 0
);

create table applicant_education (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references applicants (id) on delete cascade,
  degree        text not null,
  institution   text not null default '',
  year          text not null default ''
);

create table applicant_documents (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references applicants (id) on delete cascade,
  name          text not null,
  category      text not null default '',
  storage_path  text,
  uploaded_at   timestamptz not null default now()
);

create table applicant_notes (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references applicants (id) on delete cascade,
  author_id     uuid references staff (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------ placements --

create table requests (
  id                       uuid primary key default gen_random_uuid(),
  type                     text not null check (type in ('Domestic', 'Profession')),
  contract_duration_months smallint not null default 24,
  applicant_id             uuid not null references applicants (id) on delete restrict,
  employer_id              uuid not null references employers (id) on delete restrict,
  responsible_staff_id     uuid references staff (id) on delete set null,
  agency_id                uuid references agencies (id) on delete set null,
  mosaned_number           text not null default '',
  notes_en                 text not null default '',
  notes_ar                 text not null default '',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table request_status_history (
  id                    uuid primary key default gen_random_uuid(),
  request_id            uuid not null references requests (id) on delete cascade,
  status                text not null,
  occurred_on           date not null,
  cost                  numeric(12,2) not null default 0 check (cost >= 0),
  payment_source_id     uuid references payment_sources (id) on delete set null,
  responsible_staff_id  uuid references staff (id) on delete set null,
  attachment_path       text,
  notes                 text not null default '',
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------- money ---

create table invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  request_id     uuid references requests (id) on delete set null,
  employer_id    uuid not null references employers (id) on delete restrict,
  agency_id      uuid references agencies (id) on delete set null,
  service_price  numeric(12,2) not null check (service_price >= 0),
  status         text not null default 'Issued'
                   check (status in ('Issued', 'Partial Payment', 'Completed')),
  issued_on      date not null default current_date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table invoice_payments (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references invoices (id) on delete cascade,
  paid_on           date not null,
  amount            numeric(12,2) not null check (amount > 0),
  payment_source_id uuid references payment_sources (id) on delete set null,
  created_at        timestamptz not null default now()
);

create table payroll_entries (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null references staff (id) on delete cascade,
  -- First day of the month the entry covers.
  period        date not null,
  basic_salary  numeric(12,2) not null default 0 check (basic_salary >= 0),
  overtime      numeric(12,2) not null default 0 check (overtime >= 0),
  allowances    numeric(12,2) not null default 0 check (allowances >= 0),
  status        text not null default 'Pending' check (status in ('Paid', 'Pending')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (staff_id, period)
);

create table office_expenses (
  id          uuid primary key default gen_random_uuid(),
  item_en     text not null,
  item_ar     text not null default '',
  category    text not null default '',
  amount      numeric(12,2) not null check (amount >= 0),
  spent_on    date not null,
  status      text not null default 'Paid' check (status in ('Paid', 'Pending')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ app state ---

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  detail      text not null default '',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- One row, enforced by the check constraint.
create table settings (
  id              boolean primary key default true check (id),
  company_name    text not null default 'Eleutheria',
  company_tagline text not null default 'International Placement Services',
  license_number  text not null default '',
  address         text not null default '',
  currency        text not null default 'USD',
  updated_at      timestamptz not null default now()
);

-- -------------------------------------------------------------- indexes ---

create index on cities (country_id);
create index on applicants (agency_id);
create index on applicants (status);
create index on applicants (published_to_website) where published_to_website;
create index on applicant_experience (applicant_id);
create index on applicant_education (applicant_id);
create index on applicant_documents (applicant_id);
create index on applicant_notes (applicant_id);
create index on requests (applicant_id);
create index on requests (employer_id);
create index on requests (agency_id);
create index on request_status_history (request_id, occurred_on);
create index on invoices (employer_id);
create index on invoices (agency_id);
create index on invoice_payments (invoice_id);
create index on payroll_entries (period);
create index on office_expenses (spent_on);

-- ------------------------------------------------------------- triggers ---

create trigger staff_updated        before update on staff        for each row execute function set_updated_at();
create trigger agencies_updated     before update on agencies     for each row execute function set_updated_at();
create trigger employers_updated    before update on employers    for each row execute function set_updated_at();
create trigger applicants_updated   before update on applicants   for each row execute function set_updated_at();
create trigger requests_updated     before update on requests     for each row execute function set_updated_at();
create trigger invoices_updated     before update on invoices     for each row execute function set_updated_at();
create trigger payroll_updated      before update on payroll_entries for each row execute function set_updated_at();
create trigger office_exp_updated   before update on office_expenses for each row execute function set_updated_at();
create trigger settings_updated     before update on settings     for each row execute function set_updated_at();
