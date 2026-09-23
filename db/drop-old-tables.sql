-- Clearing out the dummy tables, carefully.
--
-- You said the tables already in the project hold dummy data and can go. This
-- does not drop them. It *writes out* the drop statements for everything in
-- `public`, so you can read the list first, delete any line you want to keep,
-- and then run what is left. Dropping a table you actually needed is not
-- something a database lets you undo, and I cannot see your list from here.
--
-- Run this AFTER the migrations, so published_workers already exists and is
-- excluded below.

select string_agg(
         format('drop table if exists public.%I cascade;', tablename),
         E'\n' order by tablename
       ) as statements_to_review
  from pg_tables
 where schemaname = 'public';

-- Views, if any, are dropped separately:
select string_agg(
         format('drop view if exists public.%I cascade;', viewname),
         E'\n' order by viewname
       ) as views_to_review
  from pg_views
 where schemaname = 'public'
   and viewname <> 'published_workers';   -- the one the website now reads
