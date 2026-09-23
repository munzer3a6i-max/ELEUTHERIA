-- 0002_security.sql, piece 4 of 4.
-- Run the pieces in order, each on its own. Running one twice is safe.

grant select on public.published_workers to anon, authenticated;
