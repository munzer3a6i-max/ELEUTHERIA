-- 0015_super_admin.sql, piece 1 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The super administrator, and the stages as data.
--
-- Two offices had grown into one role. Running the office -- the caseload and
-- the money -- is one job; deciding who may sign in, what the lists hold and
-- what the stages of a recruitment are is another, and it is the one that can
-- hand itself out. They are separate roles now:
--
--   super_admin  everything, and the only one who may write the System tables.
--   admin        the whole caseload and the whole of the money, nothing more.
--
-- Nothing already stored changes meaning: an existing administrator keeps
-- every power they had except the System pages, and the promotion to
-- super_admin is a one-line update at the bottom of this file.
--
-- Re-runnable, like every migration here.

-- ------------------------------------------------------------- the role ---

alter table ops.staff drop constraint if exists staff_role_check;

alter table ops.staff add constraint staff_role_check
  check (role in ('super_admin', 'admin', 'accountant', 'data_entry'));

create or replace function ops.is_super_admin() returns boolean
language sql stable as $$ select ops.current_role() = 'super_admin' $$;

-- Everywhere that already said "administrator" keeps meaning it, with the
-- super administrator counted in: they can do anything an administrator can.
create or replace function ops.is_admin() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin') $$;

create or replace function ops.can_read_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'accountant') $$;

create or replace function ops.can_write_finance() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'accountant') $$;

create or replace function ops.can_write_operations() returns boolean
language sql stable as $$ select ops.current_role() in ('admin', 'super_admin', 'data_entry') $$;

-- --------------------------------------------------------- the stages -----

-- The stages of each pipeline. They were compiled into the app, which meant
-- adding one needed a developer; they are rows now, and the Statuses page
-- writes them. A stage already logged against a placement keeps its label in
-- that log whatever happens here: the log records what was done, not what the
-- list says today.
create table if not exists ops.status_definitions (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  pipeline      text not null check (pipeline in ('Domestic', 'Profession', 'Invoice')),
  step_order    smallint not null default 0,
  default_cost  numeric(12,2) not null default 0 check (default_cost >= 0),
  cost_note     text not null default '',
  is_terminal   boolean not null default false,
  is_exception  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists ops_status_definitions_pipeline_order_idx
  on ops.status_definitions (pipeline, step_order);

-- PostgREST keeps its own picture of the schema and only reloads it when told.
-- A table it has not heard of is "not found in the schema cache", which reaches
-- the dashboard as a save that will not go through, so say it out loud here
-- rather than leaving somebody to wonder.
notify pgrst, 'reload schema';
