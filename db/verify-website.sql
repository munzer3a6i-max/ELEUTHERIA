-- Does the website's half work? Paste all of this and run it once.
--
-- It asks the question the way the website asks it: as `anon`, the anonymous
-- role a visitor's browser arrives as, with no key and no session. The role is
-- dropped again when the editor's transaction ends.
--
-- workers_the_website_can_see is the number of workers the site will list. Zero
-- is a perfectly good answer when nobody has been switched on yet -- it means
-- the reading works and there is nothing published, which is different from the
-- site failing to read at all. If this statement errors instead, that is the
-- fault the website is hitting.

set local role anon;

select
  (select count(*) from public.published_workers)          as workers_the_website_can_see,
  (select count(*) from public.published_workers
    where photo_path is not null)                          as with_a_photograph,
  (select count(*) from public.published_workers
    where cv_path is not null)                             as with_a_cv,
  coalesce((select string_agg(english_name, ', ' order by english_name)
              from public.published_workers), '(nobody yet)') as who,
  case
    when (select count(*) from public.published_workers) > 0
      then 'OK — the site can read these.'
    else 'OK — the site can read the list; nothing is published yet. Turn a worker on in the dashboard and run this again.'
  end                                                      as verdict;
