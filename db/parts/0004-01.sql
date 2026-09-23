-- 0004_derived_billing.sql, piece 1 of 3.
-- Run the pieces in order, each on its own. Running one twice is safe.

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
