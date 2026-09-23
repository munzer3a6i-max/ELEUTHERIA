-- 0001_schema.sql, piece 5 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
