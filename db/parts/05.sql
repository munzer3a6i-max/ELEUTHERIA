-- Eleutheria schema, part 5 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

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
