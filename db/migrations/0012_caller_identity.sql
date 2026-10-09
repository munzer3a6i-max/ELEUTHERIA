-- Who is signed in, however the question is asked.
--
-- Every rule in this database turns on ops.is_staff(), which turns on
-- auth.uid(), which reads the signed-in account out of a setting the server
-- puts on the connection before it runs anything.
--
-- The catch is that there is more than one server. PostgREST, which the
-- dashboard's queries go through, sets request.jwt.claims. Storage, which
-- uploads go through, has set request.jwt.claim.sub as well, and older
-- projects' auth.uid() reads only one of the two. When the one it reads is
-- the one that service did not set, auth.uid() is null, the caller looks like
-- a stranger, and the upload is refused with a row level security error --
-- while every other screen in the dashboard works, because its queries come
-- in through the service that does set the setting auth.uid() reads.
--
-- So the identity is resolved here instead, from whichever of the two is
-- present. It is still the signed-in account and nothing else: both settings
-- are put there by the server out of a verified token, and neither can be set
-- by anybody calling in.

create or replace function ops.caller_uid() returns uuid
language plpgsql stable as $$
declare sub text;
begin
  -- Whatever the project's own auth.uid() manages first, since that is what
  -- the rest of Supabase agrees on.
  begin
    sub := auth.uid()::text;
  exception when others then
    sub := null;
  end;
  if sub is not null then return sub::uuid; end if;

  sub := nullif(current_setting('request.jwt.claim.sub', true), '');
  if sub is null then
    begin
      sub := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
    exception when others then
      sub := null;
    end;
  end if;

  begin
    return sub::uuid;
  exception when others then
    return null;
  end;
end
$$;

-- The one line that changes: the caller's id now comes from the function
-- above rather than from auth.uid() alone.
create or replace function ops.current_role() returns text
language sql stable security definer set search_path = ops, pg_temp as $$
  select role from ops.staff where user_id = ops.caller_uid() and status = 'Active';
$$;
