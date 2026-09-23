-- Let the API serve the ops schema.
--
-- The dashboard has a setting for this -- Project Settings, then API or Data
-- API, under "Exposed schemas" -- but it has moved more than once and may not
-- be where a guide says it is. This does the same thing in SQL, which does not
-- move.
--
-- PostgREST reads the list of schemas it serves from a setting on the
-- `authenticator` role. This reads whatever is set now, adds `ops` if it is
-- missing, leaves everything else alone, and tells PostgREST to reload.

do $$
declare
  present text;
  updated text;
begin
  select coalesce(
           (select split_part(config, '=', 2)
              from pg_roles r, unnest(coalesce(r.rolconfig, '{}')) as config
             where r.rolname = 'authenticator'
               and config like 'pgrst.db_schemas=%'
             limit 1),
           'public, graphql_public')
    into present;

  if present ~ ('(^|[, ])ops($|[, ])') then
    raise notice 'ops is already exposed: %', present;
    return;
  end if;

  updated := present || ', ops';
  execute format('alter role authenticator set pgrst.db_schemas = %L', updated);
  raise notice 'exposed schemas were: %', present;
  raise notice 'exposed schemas now:  %', updated;
end
$$;

-- Ask PostgREST to pick the change up. Without this it keeps serving the old
-- list until the project restarts.
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

-- What the API will serve from now on:
select split_part(config, '=', 2) as exposed_schemas
  from pg_roles r, unnest(coalesce(r.rolconfig, '{}')) as config
 where r.rolname = 'authenticator'
   and config like 'pgrst.db_schemas=%';
