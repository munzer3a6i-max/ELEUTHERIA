-- Starting the dashboard for real.
--
-- An empty database is not a working one: nothing is readable until an active
-- staff row points at a signed-in account, which is deliberate, and the lists
-- the screens offer have to come from somewhere. This puts in the one account
-- you will sign in with and the reference data behind the dropdowns. Nothing
-- else -- no workers, no requests, no money. Those you enter yourself.
--
-- BEFORE RUNNING THIS
--
--   1. Authentication, Users, Add user. Use a real email and a password you
--      choose, and tick "Auto confirm user".
--   2. Put that email on the line marked below.
--
-- Then run the whole file. It can be run again safely.

-- ---------------------------------------------------------------- EDIT ME --

do $$
declare
  the_email text := 'you@eleutheria.agency';   -- <-- the same email
  your_name text := 'Kylie';                   -- <-- your name
  the_user  uuid;
begin
  select id into the_user from auth.users where lower(email) = lower(the_email);

  if the_user is null then
    raise exception E'No auth user with the email %.\n'
      'Create one first: Authentication, Users, Add user, and tick Auto confirm user.', the_email;
  end if;

  insert into ops.staff (user_id, username, name_en, email, role, status)
  values (the_user, split_part(lower(the_email), '@', 1), your_name, the_email, 'admin', 'Active')
  on conflict (username) do update
     set user_id = excluded.user_id,
         email = excluded.email,
         role = 'admin',
         status = 'Active';

  raise notice 'Signed-in account ready: % (%)', your_name, the_email;
end
$$;

-- ---------------------------------------------------------- the company ---

insert into ops.settings (id, company_name, company_tagline, license_number, address, currency)
values (true, 'Eleutheria', 'International Placement Services',
        'DMW-622-LB-07032025-R', 'Gedisco Center, Ermita, Manila', 'USD')
on conflict (id) do nothing;

-- ------------------------------------------------- behind the dropdowns ---
-- Edit these to suit; they are only starting points, and the app can add more.

-- Matched by name rather than by id: nothing here has a unique constraint on
-- its name, so `on conflict do nothing` would not stop a second run from
-- adding every one of them again.
insert into ops.countries (name_en, name_ar)
select v.name_en, v.name_ar
  from (values
    ('Philippines', 'الفلبين'),
    ('Saudi Arabia', 'المملكة العربية السعودية'),
    ('Indonesia', 'إندونيسيا'),
    ('India', 'الهند')
  ) as v (name_en, name_ar)
 where not exists (select 1 from ops.countries x where x.name_en = v.name_en);

insert into ops.cities (country_id, name_en, name_ar)
select c.id, v.name_en, v.name_ar
  from (values
    ('Philippines', 'Manila', 'مانيلا'),
    ('Philippines', 'Cebu', 'سيبو'),
    ('Saudi Arabia', 'Riyadh', 'الرياض'),
    ('Saudi Arabia', 'Jeddah', 'جدة'),
    ('Saudi Arabia', 'Dammam', 'الدمام')
  ) as v (country, name_en, name_ar)
  join ops.countries c on c.name_en = v.country
 where not exists (select 1 from ops.cities x where x.name_en = v.name_en);

insert into ops.professions (name_en, name_ar)
select v.name_en, v.name_ar
  from (values
    ('Housemaid', 'عاملة منزلية'),
    ('Driver', 'سائق'),
    ('Caregiver', 'مقدمة رعاية'),
    ('Cook', 'طباخ'),
    ('Mechanic', 'ميكانيكي'),
    ('Hairdresser', 'مصففة شعر'),
    ('Barista', 'باريستا')
  ) as v (name_en, name_ar)
 where not exists (select 1 from ops.professions x where x.name_en = v.name_en);

insert into ops.payment_sources (name, scopes)
select v.name, v.scopes
  from (values
    ('Cash - Agency', array['Invoices', 'Request Status']),
    ('Bank Transfer', array['Invoices', 'Request Status']),
    ('Credit Card', array['Invoices']),
    ('Cheque', array['Invoices'])
  ) as v (name, scopes)
 where not exists (select 1 from ops.payment_sources x where x.name = v.name);

-- ------------------------------------------------------------- the check --

select
  (select count(*) from ops.staff where role = 'admin' and user_id is not null) as admin_accounts,
  (select count(*) from ops.countries)                                          as countries,
  (select count(*) from ops.professions)                                        as professions,
  (select count(*) from ops.payment_sources)                                    as payment_sources,
  case
    when (select count(*) from ops.staff where role = 'admin' and user_id is not null) = 0
      then 'NOT READY — no administrator is linked to an auth account.'
    else 'Ready. Put the project URL and anon key in .env.local, then sign in with that email.'
  end                                                                           as verdict;
