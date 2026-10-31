-- 0019_leads.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- Leads: employers' enquiries, from the first message to a job order.
--
-- Every row is entered by hand through the Add lead form on the Leads page,
-- which sits with the System pages and so belongs to the super administrators.
-- The database says the same: only they read or write this table.
--
-- Times are kept as instants (timestamptz) and shown in Arabia Standard Time,
-- the clock the employers keep; the day an enquiry arrived is a plain date.
--
-- Additive and re-runnable.

create table if not exists ops.leads (
  id                    uuid primary key default gen_random_uuid(),
  employer_name         text not null,
  contact_name          text not null default '',
  phone                 text not null default '',
  email                 text not null default '',
  -- What they asked for, as they put it: "24 ICU & ER nurses".
  need                  text not null default '',
  city                  text not null default '',
  source                text not null default 'WhatsApp'
                          check (source in ('WhatsApp', 'Email', 'Website form')),
  stage                 text not null default 'New enquiry'
                          check (stage in ('New enquiry', 'Qualified', 'Shortlisting', 'Proposal sent', 'Won', 'Lost')),
  owner_id              uuid references ops.staff (id) on delete set null,
  received_on           date not null default current_date,
  last_contact_at       timestamptz,
  last_contact_channel  text check (last_contact_channel in ('WhatsApp', 'Email', 'Call', 'Meeting')),
  next_follow_up_at     timestamptz,
  next_step             text not null default '',
  notes                 text not null default '',
  created_at            timestamptz not null default now()
);

create index if not exists ops_leads_next_follow_up_idx on ops.leads (next_follow_up_at);

create index if not exists ops_leads_stage_idx on ops.leads (stage);

alter table ops.leads enable row level security;

alter table ops.leads force row level security;

drop policy if exists read_super   on ops.leads;

drop policy if exists write_super  on ops.leads;

drop policy if exists update_super on ops.leads;

drop policy if exists delete_super on ops.leads;

create policy read_super   on ops.leads for select to authenticated using (ops.is_super_admin());

create policy write_super  on ops.leads for insert to authenticated with check (ops.is_super_admin());

create policy update_super on ops.leads for update to authenticated using (ops.is_super_admin()) with check (ops.is_super_admin());

create policy delete_super on ops.leads for delete to authenticated using (ops.is_super_admin());

grant select, insert, update, delete on ops.leads to authenticated;

notify pgrst, 'reload schema';

select count(*) as leads_on_file from ops.leads;
