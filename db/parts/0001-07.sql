-- 0001_schema.sql, piece 7 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
