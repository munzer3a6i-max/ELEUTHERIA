-- Somebody on the payroll who does not sign in.
--
-- A staff row has always meant two things at once: a person the office pays,
-- and an account that opens the dashboard. Most offices have people who are
-- only the first -- a driver, a cleaner, somebody paid monthly who has no
-- business in the system at all -- and there was nowhere to put them: the row
-- demanded a username, a password and a role.
--
-- So the role list gains 'none', which opens nothing anywhere, and the username
-- becomes optional. Unique still: two people cannot share one, but any number
-- of people can have none, because in Postgres a unique index lets nulls be.
--
-- Nothing already stored changes. Every existing row keeps its username and its
-- role, and re-running this file does nothing at all.

alter table ops.staff drop constraint if exists staff_role_check;
alter table ops.staff add constraint staff_role_check
  check (role in ('super_admin', 'admin', 'accountant', 'data_entry', 'none'));

alter table ops.staff alter column username drop not null;

-- An empty string is not "no username", it is a username nobody can type and
-- that a second person cannot have. Rows written before this file could carry
-- one, so they are turned into the real answer.
update ops.staff set username = null where username = '';

notify pgrst, 'reload schema';

-- Who is on the roster, and who among them can get in.
select name_en as staff,
       role,
       coalesce(username, '(no sign-in)') as username,
       status
  from ops.staff
 order by (role = 'none'), name_en;
