-- Workers whose record has not caught up with their stage log.
--
-- From today the dashboard moves a worker's status the moment her placement
-- reaches Selected, Deployed or Back Out. Rows recorded before that never got
-- the chance, and the published view asks her record rather than her stage
-- log -- so a worker who flew months ago may still be advertising herself on
-- the website.
--
-- This file CHANGES NOTHING. It lists them so you can see who they are first.
-- The update that fixes them is at the bottom, commented out, for you to run
-- when you are happy with the list.

select
  a.english_name,
  a.status            as record_says,
  case
    when h.reached_backout  then 'Back Out'
    when h.reached_deployed then 'Deployed'
    else 'Selected'
  end                 as stages_say,
  a.published_to_website,
  case
    when a.published_to_website and a.status = 'Available'
      then 'ON THE WEBSITE, and should not be'
    else 'not published'
  end                 as website
from ops.applicants a
join (
  select
    r.applicant_id,
    bool_or(sh.status = 'Back Out') as reached_backout,
    bool_or(sh.status = 'Deployed') as reached_deployed,
    bool_or(sh.status = 'Selected') as reached_selected
  from ops.requests r
  join ops.request_status_history sh on sh.request_id = r.id
  group by r.applicant_id
) h on h.applicant_id = a.id
where (h.reached_backout or h.reached_deployed or h.reached_selected)
  and a.status in ('Available', 'Unavailable')
order by a.published_to_website desc, a.english_name;

-- ---------------------------------------------------------------------------
-- When the list above reads right, remove the comment markers from the block
-- below and run it. It moves each of those workers to the furthest stage her
-- own log reached, and touches nobody else: a worker already marked Selected,
-- Deployed or Back Out is left exactly as she is, and no other column moves.
-- ---------------------------------------------------------------------------

-- update ops.applicants a
-- set status = case
--       when h.reached_backout  then 'Back Out'
--       when h.reached_deployed then 'Deployed'
--       else 'Selected'
--     end
-- from (
--   select
--     r.applicant_id,
--     bool_or(sh.status = 'Back Out') as reached_backout,
--     bool_or(sh.status = 'Deployed') as reached_deployed,
--     bool_or(sh.status = 'Selected') as reached_selected
--   from ops.requests r
--   join ops.request_status_history sh on sh.request_id = r.id
--   group by r.applicant_id
-- ) h
-- where h.applicant_id = a.id
--   and (h.reached_backout or h.reached_deployed or h.reached_selected)
--   and a.status in ('Available', 'Unavailable')
-- returning a.english_name, a.status;
