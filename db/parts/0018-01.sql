-- 0018_peso_rate.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The office's peso rate.
--
-- The books are kept in dollars and the office lives in pesos, so the
-- dashboard can show every amount in both, side by side, at a rate the office
-- sets itself. The rate is a fact about the books, not about one screen, so it
-- is kept with the company's details here; whether a given machine shows the
-- pesos at all is that machine's choice, like its language, and stays local.
--
-- Additive and re-runnable.

alter table ops.settings add column if not exists peso_rate numeric(10,4) not null default 56.5
  check (peso_rate > 0);

notify pgrst, 'reload schema';

select peso_rate as pesos_per_dollar from ops.settings;
