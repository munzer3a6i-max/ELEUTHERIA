-- 0001_schema.sql, piece 7 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
