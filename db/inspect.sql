-- What is in the project right now.
--
-- Run this first, in the Supabase SQL editor, and send me the result. It tells
-- me what the website already has, which decides one open question: whether
-- publishing a worker should write into a table your site already reads, or
-- whether the site should read the new published_workers view instead.
--
-- Read only. Nothing here creates, alters or drops anything.

select
  n.nspname                                   as schema,
  c.relname                                   as name,
  case c.relkind when 'r' then 'table'
                 when 'v' then 'view'
                 when 'm' then 'materialised view' end as kind,
  case when c.relkind = 'r' and not c.relrowsecurity
       then 'NO ROW LEVEL SECURITY' else '' end as warning,
  coalesce(s.n_live_tup, 0)                   as approx_rows,
  (select count(*) from information_schema.columns col
    where col.table_schema = n.nspname and col.table_name = c.relname) as columns
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_user_tables s on s.relid = c.oid
where c.relkind in ('r', 'v', 'm')
  and n.nspname not in (
    'pg_catalog', 'information_schema', 'pg_toast', 'extensions', 'graphql',
    'graphql_public', 'net', 'pgsodium', 'pgsodium_masks', 'vault', 'realtime',
    'storage', 'supabase_functions', 'supabase_migrations', '_realtime', 'auth'
  )
order by n.nspname, c.relname;
