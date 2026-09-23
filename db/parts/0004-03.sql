-- 0004_derived_billing.sql, piece 3 of 3.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- --------------------------------------------------------------- triggers --

-- The stage log is the origin of all of it.
create or replace function ops.on_status_history_change() returns trigger
language plpgsql security definer set search_path = ops, pg_temp as $$
begin
  perform ops.sync_derived_billing(coalesce(new.request_id, old.request_id));
  return null;
end;
$$;

drop trigger if exists status_history_derives_billing on ops.request_status_history;

create trigger status_history_derives_billing
  after insert or update or delete on ops.request_status_history
  for each row execute function ops.on_status_history_change();

-- Attaching or detaching an agent changes who is owed for every request of
-- hers; so does moving a worker to another partner office.
create or replace function ops.on_applicant_change() returns trigger
language plpgsql security definer set search_path = ops, pg_temp as $$
declare r uuid;
begin
  if new.agent_id is distinct from old.agent_id or new.agency_id is distinct from old.agency_id then
    for r in select id from ops.requests where applicant_id = new.id loop
      perform ops.sync_derived_billing(r);
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists applicant_derives_billing on ops.applicants;

create trigger applicant_derives_billing
  after update on ops.applicants
  for each row execute function ops.on_applicant_change();

-- A changed fee or contract price moves every unsettled amount that came from
-- it. One function per table: `new` is a different row type in each, and a
-- single function referring to a column only one of them has fails the moment
-- it runs.
create or replace function ops.on_agent_terms_change() returns trigger
language plpgsql security definer set search_path = ops, pg_temp as $$
declare r uuid;
begin
  if new.selection_fee is distinct from old.selection_fee
     or new.deployment_fee is distinct from old.deployment_fee then
    for r in
      select req.id from ops.requests req
        join ops.applicants a on a.id = req.applicant_id
       where a.agent_id = new.id
    loop
      perform ops.sync_derived_billing(r);
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists agent_terms_derive_billing on ops.agents;

create trigger agent_terms_derive_billing
  after update on ops.agents
  for each row execute function ops.on_agent_terms_change();

create or replace function ops.on_contract_change() returns trigger
language plpgsql security definer set search_path = ops, pg_temp as $$
declare r uuid;
begin
  for r in select id from ops.requests where agency_id = new.agency_id loop
    perform ops.sync_derived_billing(r);
  end loop;
  return null;
end;
$$;

drop trigger if exists contract_terms_derive_billing on ops.agency_contracts;

create trigger contract_terms_derive_billing
  after insert or update on ops.agency_contracts
  for each row execute function ops.on_contract_change();

-- Rebuilds everything from the stage log. Run it once after an import, or any
-- time you want to be sure the books agree with the history.
create or replace function ops.rebuild_derived_billing() returns integer
language plpgsql security definer set search_path = ops, pg_temp as $$
declare r uuid; n integer := 0;
begin
  for r in select id from ops.requests loop
    perform ops.sync_derived_billing(r);
    n := n + 1;
  end loop;
  return n;
end;
$$;
