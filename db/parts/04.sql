-- Eleutheria schema, part 4 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

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
