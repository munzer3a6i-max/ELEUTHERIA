-- 0016_directory_and_placements.sql, piece 2 of 2.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- What this file leaves behind, as the last thing on screen.
select tablename as table_name,
       policyname as policy,
       cmd as applies_to
  from pg_policies
 where schemaname = 'ops'
   and tablename in ('applicants', 'requests')
 order by tablename, cmd, policyname;
