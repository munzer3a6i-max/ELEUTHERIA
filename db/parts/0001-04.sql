-- 0001_schema.sql, piece 4 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
