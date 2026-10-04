-- Two lists the office keeps, and one column that uses the first of them.
--
-- They are part of 0001_schema.sql and 0002_security.sql now, so a database
-- built from scratch has them already. This file is what an office that is
-- already running needs: the same tables and column where they are missing,
-- and the names to start with.
--
-- A domestic worker belongs to one of the managers who brought her in, and at
-- the end of the month what she earned is split along that line. It is a
-- managed list rather than two names in the code, because a third manager
-- arriving should not need a developer.
--
-- Office expense categories were a fixed list in the application for the same
-- bad reason. They are data now, and the ones that were hard-coded are seeded
-- here so nothing an office has already filed changes its name.

create table if not exists ops.managers (
  id         uuid primary key default gen_random_uuid(),
  name_en    text not null,
  name_ar    text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists ops.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name_en    text not null,
  name_ar    text not null default '',
  created_at timestamptz not null default now()
);

-- Whose worker she is. Null for a worker nobody has claimed yet, and for the
-- tradesmen, who do not come through a manager at all.
alter table ops.applicants add column if not exists manager_id uuid references ops.managers (id) on delete set null;

create index if not exists ops_applicants_manager_id_idx on ops.applicants (manager_id);

-- ------------------------------------------------------------ the rules ---

do $$
declare t text;
begin
  foreach t in array array['managers', 'expense_categories']
  loop
    execute format('alter table ops.%I enable row level security', t);
    execute format('alter table ops.%I force row level security', t);
    execute format('drop policy if exists read_all_staff on ops.%I', t);
    execute format('drop policy if exists write_admin on ops.%I', t);
    execute format('drop policy if exists update_admin on ops.%I', t);
    execute format('drop policy if exists delete_admin on ops.%I', t);
    execute format('create policy read_all_staff on ops.%I for select to authenticated using (ops.is_staff())', t);
    execute format('create policy write_admin on ops.%I for insert to authenticated with check (ops.is_admin())', t);
    execute format('create policy update_admin on ops.%I for update to authenticated using (ops.is_admin()) with check (ops.is_admin())', t);
    execute format('create policy delete_admin on ops.%I for delete to authenticated using (ops.is_admin())', t);
  end loop;
end
$$;

grant select, insert, update, delete on ops.managers, ops.expense_categories to authenticated;

-- ---------------------------------------------------------- what is here --

-- Named rather than numbered, so running this twice adds nobody twice.
insert into ops.managers (name_en, name_ar)
select v.en, v.ar from (values ('Maan', 'معن'), ('Farid', 'فريد')) as v(en, ar)
where not exists (select 1 from ops.managers m where m.name_en = v.en);

insert into ops.expense_categories (name_en, name_ar)
select v.en, v.ar from (values
  ('Rent', 'إيجار'),
  ('Utilities', 'خدمات'),
  ('Supplies', 'لوازم'),
  ('Accommodation', 'سكن'),
  ('Logistics', 'نقل'),
  ('Other', 'أخرى')
) as v(en, ar)
where not exists (select 1 from ops.expense_categories c where c.name_en = v.en);
