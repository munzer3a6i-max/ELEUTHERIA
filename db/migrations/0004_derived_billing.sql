-- The money the stage log creates, created by the database.
--
-- An agent earns half their fee when their candidate is selected and the other
-- half when she is deployed. A partner office owes half its contract price at
-- selection and the other half when the visa is issued. A worker who pulls out
-- opens a backout. None of that is typed in: it follows from the stage log.
--
-- The app has worked this out in the browser until now. That stops here, for a
-- reason that only appears once the roles are real: data entry may log a stage
-- but may not read finance, so a browser that cannot see a commission cannot
-- maintain one either. Deriving it here means it happens whoever logs the
-- stage, and there is one copy of the rule rather than one per client.
--
-- Two things this must never do, the same two the application never did:
--   * change or remove a row whose money has already moved
--   * invent a row for a stage that has not happened
--
-- Mirrors src/lib/derivedBilling.ts and src/data/businessRules.ts.

-- A worker who leaves before this many months is brought home at our expense.
create or replace function ops.guarantee_months() returns integer
language sql immutable as $$ select 3 $$;

create or replace function ops.months_between(from_date date, to_date date)
returns integer language sql immutable as $$
  select greatest(0, (extract(year from age(to_date, from_date)) * 12
                    + extract(month from age(to_date, from_date)))::int)
$$;

create or replace function ops.sync_derived_billing(p_request uuid) returns void
language plpgsql security definer set search_path = ops, pg_temp as $$
declare
  the_request   ops.requests%rowtype;
  the_applicant ops.applicants%rowtype;
  the_agent     ops.agents%rowtype;
  the_contract  ops.agency_contracts%rowtype;
  half          numeric(12,2);
  on_selected   date;
  on_deployed   date;
  on_visa       date;
  on_backout    date;
  liability     text;
begin
  select * into the_request from ops.requests where id = p_request;
  if not found then return; end if;
  select * into the_applicant from ops.applicants where id = the_request.applicant_id;
  if not found then return; end if;

  -- The latest date each milestone was logged on, or null if it never was.
  select max(occurred_on) into on_selected
    from ops.request_status_history where request_id = p_request and status = 'Selected';
  select max(occurred_on) into on_deployed
    from ops.request_status_history where request_id = p_request and status = 'Deployed';
  select max(occurred_on) into on_visa
    from ops.request_status_history where request_id = p_request and status = 'Visa Stamping';
  select max(occurred_on) into on_backout
    from ops.request_status_history where request_id = p_request and status = 'Back Out';

  -- ---------------------------------------------------- the agent's halves --
  select * into the_agent from ops.agents where id = the_applicant.agent_id;

  if found and on_selected is not null then
    insert into ops.agent_commissions (agent_id, applicant_id, request_id, milestone, amount, earned_on)
    values (the_agent.id, the_applicant.id, p_request, 'Selected', the_agent.selection_fee, on_selected)
    on conflict (request_id, milestone) do update
       set agent_id = excluded.agent_id,
           applicant_id = excluded.applicant_id,
           amount = excluded.amount,
           earned_on = excluded.earned_on
     where ops.agent_commissions.status = 'Pending';
  else
    delete from ops.agent_commissions
     where request_id = p_request and milestone = 'Selected' and status = 'Pending';
  end if;

  if the_agent.id is not null and on_deployed is not null then
    insert into ops.agent_commissions (agent_id, applicant_id, request_id, milestone, amount, earned_on)
    values (the_agent.id, the_applicant.id, p_request, 'Deployed', the_agent.deployment_fee, on_deployed)
    on conflict (request_id, milestone) do update
       set agent_id = excluded.agent_id,
           applicant_id = excluded.applicant_id,
           amount = excluded.amount,
           earned_on = excluded.earned_on
     where ops.agent_commissions.status = 'Pending';
  else
    delete from ops.agent_commissions
     where request_id = p_request and milestone = 'Deployed' and status = 'Pending';
  end if;

  -- ------------------------------------------- the partner office's halves --
  -- A contract prices a domestic worker. A tradesman placed through the same
  -- office is not covered by it, and must not be billed at that price.
  if the_request.type = 'Domestic' then
    select * into the_contract
      from ops.agency_contracts
     where agency_id = the_request.agency_id
     order by (status = 'Active') desc, signed_on desc nulls last
     limit 1;
  end if;
  half := round(coalesce(the_contract.price_per_worker, 0) / 2, 2);

  if the_contract.id is not null and on_selected is not null then
    insert into ops.agency_charges (agency_id, contract_id, applicant_id, request_id, milestone, amount, due_on)
    values (the_contract.agency_id, the_contract.id, the_applicant.id, p_request, 'Selected', half, on_selected)
    on conflict (request_id, milestone) do update
       set agency_id = excluded.agency_id,
           contract_id = excluded.contract_id,
           applicant_id = excluded.applicant_id,
           amount = excluded.amount,
           due_on = excluded.due_on
     where ops.agency_charges.status = 'Pending';
  else
    delete from ops.agency_charges
     where request_id = p_request and milestone = 'Selected' and status = 'Pending';
  end if;

  if the_contract.id is not null and on_visa is not null then
    insert into ops.agency_charges (agency_id, contract_id, applicant_id, request_id, milestone, amount, due_on)
    values (the_contract.agency_id, the_contract.id, the_applicant.id, p_request, 'Visa Issued', half, on_visa)
    on conflict (request_id, milestone) do update
       set agency_id = excluded.agency_id,
           contract_id = excluded.contract_id,
           applicant_id = excluded.applicant_id,
           amount = excluded.amount,
           due_on = excluded.due_on
     where ops.agency_charges.status = 'Pending';
  else
    delete from ops.agency_charges
     where request_id = p_request and milestone = 'Visa Issued' and status = 'Pending';
  end if;

  -- ------------------------------------------------------------- backouts --
  if on_backout is not null then
    -- Deployment only counts if it came first; she can also walk away
    -- mid-pipeline, and what was spent on her is just as real.
    if on_deployed is null or on_deployed > on_backout then
      on_deployed := null;
    end if;

    liability := case
      when on_deployed is null then 'Company'
      when ops.months_between(on_deployed, on_backout) < ops.guarantee_months() then 'Company'
      else 'Employer'
    end;

    insert into ops.backouts (request_id, applicant_id, deployed_on, returned_on, liability)
    values (p_request, the_applicant.id, on_deployed, on_backout, liability)
    on conflict (request_id) do update
       set applicant_id = excluded.applicant_id,
           deployed_on = excluded.deployed_on,
           returned_on = excluded.returned_on,
           -- An office that decided the agency carries it has decided.
           liability = case when ops.backouts.liability = 'Agency' then 'Agency' else excluded.liability end;
  else
    -- Only while nothing has been spent on bringing her home: a bill is a
    -- record, not a toggle.
    delete from ops.backouts b
     where b.request_id = p_request
       and not exists (select 1 from ops.backout_costs c where c.backout_id = b.id);
  end if;
end;
$$;

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
