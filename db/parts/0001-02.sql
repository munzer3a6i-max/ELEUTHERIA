-- 0001_schema.sql, piece 2 of 7.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The partner office abroad that a domestic worker comes through.
create table if not exists ops.agencies (
  id                   uuid primary key default gen_random_uuid(),
  english_name         text not null,
  arabic_name          text not null default '',
  license_number       text not null default '',
  license_expiry       date,
  phone                text not null default '',
  email                text not null default '',
  telephone            text not null default '',
  rating               smallint not null default 0 check (rating between 0 and 5),
  primary_manager_en   text not null default '',
  primary_manager_ar   text not null default '',
  second_manager_en    text not null default '',
  second_manager_ar    text not null default '',
  status               text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- A person who introduces candidates one at a time and earns on each one that
-- gets through.
create table if not exists ops.agents (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null,
  name_ar         text not null default '',
  phone           text not null default '',
  email           text not null default '',
  area            text not null default '',
  status          text not null default 'Active' check (status in ('Active', 'Inactive')),
  selection_fee   numeric(12,2) not null default 0 check (selection_fee >= 0),
  deployment_fee  numeric(12,2) not null default 0 check (deployment_fee >= 0),
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists ops.employers (
  id                          uuid primary key default gen_random_uuid(),
  english_name                text not null,
  arabic_name                 text not null default '',
  email                       text not null default '',
  phone                       text not null default '',
  telephone                   text not null default '',
  national_address            text not null default '',
  national_id_number          text not null default '',
  national_address_short_code text not null default '',
  profile_image_path          text,
  status                      text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
