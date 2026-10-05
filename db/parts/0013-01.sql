-- 0013_company_contact.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- How to reach the office, on the document itself.
--
-- The CV's letterhead prints the licence number and, under it, the line
-- somebody holding the document rings: the website and the agency's numbers.
-- They were part of the template from the start and had no home in the
-- database, so they are three columns on the one settings row rather than
-- something typed into the page by hand each time.

alter table ops.settings add column if not exists website text not null default 'eleutheria.agency';

alter table ops.settings add column if not exists phones  text not null default 'PH +63 961 278 0038 · PH +63 960 401 4714';

alter table ops.settings add column if not exists email   text not null default 'info@eleutheria.agency';

comment on column ops.settings.phones is
  'Printed on the CV letterhead as written, so the separators and country prefixes are the office''s choice.';
