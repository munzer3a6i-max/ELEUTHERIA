-- 0011_cv_images.sql, piece 1 of 1.
-- Run the pieces in order, each on its own. Running one twice is safe.

-- The two pictures the bio data asks for beyond her headshot.
--
-- A household wants to see the worker standing, and the sheet carries a copy
-- of her passport on its second page. Both are files like the photograph is:
-- private, kept in the buckets that already exist, and embedded in the CV when
-- it is built rather than linked, so the finished document carries them.
--
-- The passport copy is never published. It goes into worker-documents, which
-- no anonymous reader can touch, and reaches the outside world only inside a
-- CV the office chose to send.

alter table ops.applicants add column if not exists full_body_path text;

-- The name the office uploaded, beside the uuid the file is stored under.
alter table ops.applicants add column if not exists passport_copy_file_name text;
