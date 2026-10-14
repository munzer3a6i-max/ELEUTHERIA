-- Why a save is being refused.
--
-- Read-only: this file asks questions and changes nothing. Run the whole thing
-- in the Supabase SQL editor while signed in to the dashboard in another tab,
-- and read the table it prints at the end.
--
-- Every rule in this database turns on who the caller is, and the caller is
-- resolved from the signed-in account to a row in ops.staff. Three things can
-- break that chain, and each one looks the same from the dashboard: "Not
-- saved".
--
--   1. The staff row is not linked to the sign-in account (user_id is null),
--      so the database does not know what role you hold.
--   2. The role is not the one you think: the promotion in run-next.sql
--      matches by name, and a name spelled differently is not promoted.
--   3. The newest tables are not in the API's schema cache yet, so a write to
--      them is refused with "not found in the schema cache".
--
-- The last column of each row says what to do about it.

with answers as (
  select 1 as n, 'Staff rows, and whether each is linked to a sign-in account' as question,
         string_agg(
           name_en || ' = ' || role || case when user_id is null then ' (NOT LINKED)' else '' end,
           ', ' order by role, name_en
         ) as answer,
         case when count(*) filter (where user_id is null and role in ('super_admin', 'admin')) > 0
              then 'An administrator with no account linked cannot write anything. Settings, Users, Link accounts in the dashboard.'
              else 'Fine.' end as what_to_do
    from ops.staff
   where status = 'Active'

  union all
  select 2, 'Somebody holds the super administrator role',
         coalesce(string_agg(name_en, ', '), '(nobody)'),
         case when count(*) = 0
              then 'Nobody can open the System pages. Run: update ops.staff set role = ''super_admin'' where username = ''theirusername'';'
              else 'Fine.' end
    from ops.staff
   where role = 'super_admin' and status = 'Active'

  union all
  select 3, 'The stages table exists',
         coalesce(to_regclass('ops.status_definitions')::text, '(missing)'),
         case when to_regclass('ops.status_definitions') is null
              then 'Run db/run-next.sql; it was not applied.'
              else 'Fine.' end

  union all
  select 4, 'Stages saved in the database',
         (select count(*)::text from ops.status_definitions),
         case when (select count(*) from ops.status_definitions) = 0
              then 'Empty until a super administrator signs in; the dashboard writes them up by itself. Everyone sees the built-in list meanwhile.'
              else 'Fine.' end

  union all
  select 5, 'The ops schema is exposed to the API',
         coalesce(current_setting('pgrst.db_schemas', true), '(not set here)'),
         'If this does not include ops: Project Settings, API, Exposed schemas.'
)
select question, answer, what_to_do from answers order by n;

-- And, whatever the answers say, tell the API to re-read the schema. Harmless
-- to run twice, and the usual cure for a save refused right after a migration.
notify pgrst, 'reload schema';
