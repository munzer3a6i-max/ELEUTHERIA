-- 0001_schema.sql, piece 6 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
