-- Leads, in full: the record behind the lead page.
--
-- 0019 kept one line per enquiry. The lead page keeps the whole of it: a
-- reference to quote (LD-1001), whether anybody has answered, the brief the
-- employer gave, the next action in more than a few words, the one document
-- they sent, and a history -- every message, call, stage change, completed
-- action and internal note, each with who and when.
--
-- 'Manual entry' joins the sources, for an enquiry somebody was simply told
-- about. The stages are unchanged.
--
-- Additive and re-runnable. The only rows it writes are its own new columns:
-- each existing lead gets a reference, and one already contacted is marked so.

alter table ops.leads add column if not exists ref_no            integer;
alter table ops.leads add column if not exists contacted         boolean not null default false;
-- The enquiry as it came in: roles, numbers, location, start date.
alter table ops.leads add column if not exists enquiry           text not null default '';
alter table ops.leads add column if not exists contact_role      text not null default '';
alter table ops.leads add column if not exists industry          text not null default '';
alter table ops.leads add column if not exists country           text not null default '';
alter table ops.leads add column if not exists experience        text not null default '';
alter table ops.leads add column if not exists target_start      text not null default '';
alter table ops.leads add column if not exists requirements      text not null default '';
alter table ops.leads add column if not exists next_step_detail  text not null default '';
alter table ops.leads add column if not exists stage_changed_at  timestamptz;
alter table ops.leads add column if not exists document_path     text;
alter table ops.leads add column if not exists document_name     text;
alter table ops.leads add column if not exists document_size     integer;
alter table ops.leads add column if not exists document_added_at timestamptz;

-- References in the order the enquiries arrived, from LD-1001.
with numbered as (
  select id, 1000 + row_number() over (order by created_at, id)
               + coalesce((select max(ref_no) - 1000 from ops.leads where ref_no is not null), 0) as n
  from ops.leads
  where ref_no is null
)
update ops.leads l set ref_no = numbered.n from numbered where l.id = numbered.id;

update ops.leads set contacted = true where last_contact_at is not null and not contacted;

alter table ops.leads drop constraint if exists leads_source_check;
alter table ops.leads add constraint leads_source_check
  check (source in ('Manual entry', 'WhatsApp', 'Email', 'Website form'));

-- Every step of the conversation with the employer.
--
--   contact  a message, email, call or meeting, either way
--   stage    the lead moved stage
--   task     a next action was done
--   note     an internal note; never sent anywhere
create table if not exists ops.lead_activities (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references ops.leads (id) on delete cascade,
  kind              text not null check (kind in ('contact', 'stage', 'task', 'note')),
  channel           text check (channel in ('WhatsApp', 'Email', 'Call', 'Meeting')),
  direction         text check (direction in ('Inbound', 'Outbound')),
  title             text not null default '',
  body              text not null default '',
  duration_minutes  integer check (duration_minutes is null or duration_minutes >= 0),
  author_id         uuid references ops.staff (id) on delete set null,
  occurred_at       timestamptz not null default now()
);

create index if not exists ops_lead_activities_lead_id_idx on ops.lead_activities (lead_id, occurred_at);

alter table ops.lead_activities enable row level security;
alter table ops.lead_activities force row level security;

drop policy if exists read_super   on ops.lead_activities;
drop policy if exists write_super  on ops.lead_activities;
drop policy if exists update_super on ops.lead_activities;
drop policy if exists delete_super on ops.lead_activities;
create policy read_super   on ops.lead_activities for select to authenticated using (ops.is_super_admin());
create policy write_super  on ops.lead_activities for insert to authenticated with check (ops.is_super_admin());
create policy update_super on ops.lead_activities for update to authenticated using (ops.is_super_admin()) with check (ops.is_super_admin());
create policy delete_super on ops.lead_activities for delete to authenticated using (ops.is_super_admin());

grant select, insert, update, delete on ops.lead_activities to authenticated;

notify pgrst, 'reload schema';

select count(*) as leads_on_file, min(ref_no) as first_reference, max(ref_no) as last_reference from ops.leads;
