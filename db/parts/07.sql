-- Eleutheria schema, part 7 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

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

-- Who can read and write what.
--
-- The application already sorts every screen and every action into an area --
-- finance, operations, system, personal -- and gives each role a list it may
-- read and a list it may change. Until now those rules lived only in the
-- browser, where anyone who opens the developer tools can edit them. Here they
-- become the database's rules, which is the real point of the move:
--
--   admin       reads and writes everything
--   accountant  writes finance, reads operations and the reference data
--   data_entry  writes operations, and cannot read finance at all
--   anon        reads one view of published workers, and nothing else
--
-- Every table is locked by default. Nothing is readable without a policy.

-- ------------------------------------------------------------- who am i ---

-- The signed-in caller's role, or null when they are not active staff.
-- security definer so it can read ops.staff while ops.staff is itself locked.
create or replace function ops.current_role() returns text
language sql stable security definer set search_path = ops, pg_temp as $$
  select role from ops.staff where user_id = auth.uid() and status = 'Active';
$$;

create or replace function ops.is_staff() returns boolean
language sql stable as $$ select ops.current_role() is not null $$;

create or replace function ops.is_admin() returns boolean
language sql stable as $$ select ops.current_role() = 'admin' $$;

-- Reading the money: the accountant's job, and the administrator's.
create or replace function ops.can_read_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'accountant') $$;

create or replace function ops.can_write_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'accountant') $$;
