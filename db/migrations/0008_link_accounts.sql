-- Joining a staff row to the account somebody signs in with.
--
-- A staff row says what a person may do; the account in auth.users is what
-- lets them in. `user_id` is the join between them, and when it is missing the
-- person is told, correctly and unhelpfully, that no staff record points at
-- their account. That happens for anyone added before the dashboard learned to
-- make the account itself, and for anyone whose account was made by hand in
-- the Supabase dashboard.
--
-- Repairing it means reading auth.users, which nothing in the browser can do
-- and should not be able to. So it is done here, by an administrator, through
-- one function that can see only what it needs: an address, and the id that
-- goes with it.

create or replace function ops.link_staff_accounts()
returns table (staff_id uuid, username text, email text, linked boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Security definer means this runs with rights the caller does not have, so
  -- it checks for itself who is asking. Without this, anybody signed in could
  -- read the address of every account in the project.
  if not ops.is_admin() then
    raise exception 'Only an administrator can link sign-in accounts.';
  end if;

  return query
  with matched as (
    select s.id, u.id as auth_id
      from ops.staff s
      join auth.users u on lower(u.email) = lower(s.email)
     where s.user_id is null
       and s.email <> ''
       -- An account already spoken for belongs to whoever has it. Two staff
       -- rows sharing an address is somebody's mistake, and not one to settle
       -- by guessing.
       and not exists (select 1 from ops.staff other where other.user_id = u.id)
  ),
  joined as (
    update ops.staff s
       set user_id = m.auth_id
      from matched m
     where s.id = m.id
    returning s.id
  )
  -- Read from `joined` rather than from the table: the update above and this
  -- select are one statement, so the table still looks the way it did before
  -- it ran, and asking it would report every freshly linked row as unlinked.
  select s.id, s.username, s.email, (s.id in (select id from joined))
    from ops.staff s
   where s.user_id is null
   order by s.username;
end;
$$;

comment on function ops.link_staff_accounts() is
  'Points every unlinked staff row at the auth account with the same address, and reports what is still unlinked. Administrators only.';

revoke all on function ops.link_staff_accounts() from public;
grant execute on function ops.link_staff_accounts() to authenticated;
