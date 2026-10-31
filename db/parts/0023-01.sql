-- 0023_live_peso_rate.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The live peso rate.
--
-- The dashboard can now read the dollar's price in pesos from a bank's
-- published reference rate (the European Central Bank's, through Frankfurter),
-- refreshed by itself through the day. Whether the office follows that live
-- rate or keeps its own is a choice for the whole office, so it is kept here
-- beside the saved rate -- which stays, as the fallback for when the live
-- rate cannot be reached, and as the rate used when the office turns live off.
--
-- Additive and re-runnable. Live is on unless somebody turns it off.

alter table ops.settings add column if not exists peso_rate_live boolean not null default true;

notify pgrst, 'reload schema';

select peso_rate as saved_pesos_per_dollar, peso_rate_live as follows_live_rate from ops.settings;
