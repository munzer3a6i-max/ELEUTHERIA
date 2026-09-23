-- 0004_derived_billing.sql, piece 2 of 3.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
  -- The office's active contract, or the most recently signed if none is.
  select * into the_contract
    from ops.agency_contracts
   where agency_id = the_request.agency_id
   order by (status = 'Active') desc, signed_on desc nulls last
   limit 1;
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
