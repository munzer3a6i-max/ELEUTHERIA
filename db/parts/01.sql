-- Eleutheria schema, part 1 of 11.
-- Run the parts in order, each one on its own. Running one twice is safe.

-- Eleutheria operations database.
--
-- Everything the dashboard owns lives in its own schema, `ops`. The website
-- already has tables in `public`, and this migration must not touch, rename or
-- shadow any of them: a separate schema makes that a guarantee rather than a
-- promise. The only thing added to `public` is one read-only view, in
-- 0002_security.sql, which is what the website reads.
--
-- Mirrors src/types/index.ts. Nested arrays in the front-end model become
-- child tables here so they can be queried and constrained.
--
-- Bilingual values are two columns, not JSON: the app sorts and filters on
-- them, and a column is cheaper to index than a JSON path.
--
-- Money is numeric(12,2). Never float: 0.1 + 0.2 must equal 0.3 in a ledger.

create schema if not exists ops;

-- ---------------------------------------------------------------- helpers --

create or replace function ops.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------- reference --

create table if not exists ops.countries (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists ops.cities (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references ops.countries (id) on delete cascade,
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists ops.professions (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists ops.payment_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- 'Invoices' and/or 'Request Status'
  scopes      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- One row, enforced by the check constraint.
create table if not exists ops.settings (
  id              boolean primary key default true check (id),
  company_name    text not null default 'Eleutheria',
  company_tagline text not null default 'International Placement Services',
  license_number  text not null default '',
  address         text not null default '',
  currency        text not null default 'USD',
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- people --

-- An account. `user_id` is the Supabase auth user; a row without one is a
-- person on the payroll who cannot sign in. The role here is the same role the
-- interface uses, and from now on it is the database that enforces it.
create table if not exists ops.staff (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique,
  username    text not null unique check (username = lower(username)),
  name_en     text not null,
  name_ar     text not null default '',
  phone       text not null default '',
  email       text not null default '',
  role        text not null default 'data_entry'
                check (role in ('admin', 'accountant', 'data_entry')),
  status      text not null default 'Active'
                check (status in ('Active', 'Inactive', 'Suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column ops.staff.user_id is
  'The Supabase auth user. Passwords live in auth.users and never here.';
