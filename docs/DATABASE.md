# Connecting the dashboard to the database

Today the dashboard keeps everything in the browser's `localStorage`. Nothing
is shared: each person who opens the app has their own private copy, and
clearing browser data deletes it. This is how to move that into the Supabase
project at `ksfsapomxgxbdrwgesde`, which already holds the website's own
tables.

## The shape of it

```
  Dashboard (browser)                    Website (eleutheria.agency)
          |                                          |
          | staff, signed in                         | anonymous visitors
          v                                          v
   ops.*  ──────────────────────────►  public.published_workers  (read only)
   (everything this app owns)
                                       public.*  (whatever the site already has,
                                                  untouched by these migrations)
```

Everything the dashboard owns lives in its own schema, `ops`. The website's
existing tables are in `public` and these migrations do not touch, rename or
shadow any of them — a separate schema makes that a guarantee rather than a
promise. The single thing added to `public` is one read-only view,
`published_workers`, which is what the site reads.

## Step 1 — get the schema in

```bash
node scripts/apply-migrations.mjs
```

That writes two things: `db/bundle.sql`, the whole schema in one file, and
`db/parts/`, the same SQL cut into pieces of about 4 KB. Each piece is named
after the migration it came from — `0001-01.sql`, `0004-02.sql` — so adding a
migration later does not renumber the ones already run.

**Use the parts.** Paste them into the **SQL Editor** one at a time, in order.
A long paste into a web editor can be cut off silently, and what you get is a
syntax error in the middle of a table with no sign of how much was lost. Small
files cannot fail that way. Every statement is written to be safe to run
twice, so if you are ever unsure whether a part arrived whole, run it again.

When they are all in, run `db/verify.sql`. It names anything missing rather
than just counting, and tells you what to do next.

Better still, skip the copying entirely. Take the connection string from
**Project Settings → Database → Connection string** and run:

```bash
npm i -D pg --no-save
SUPABASE_DB_URL='postgresql://...' node scripts/apply-migrations.mjs --apply
```

Each file runs in its own transaction and is recorded in
`ops.schema_migrations`, so running it twice does not run anything twice. The
connection string contains the database password: pass it on the command line,
never into a file in this repository.

## Step 2 — expose the schema

The API serves `public` and nothing else until it is told otherwise, so `ops`
has to be added to its list. Without this the API answers "schema must be one
of the following", and the Database tab in Settings says so.

In the dashboard the setting is called **Exposed schemas**, and it has moved
more than once — look under **Project Settings → API**, or **Project Settings →
Data API**, or search the settings for "exposed".

If it is not where you expect, run `db/expose-ops-schema.sql` instead. It reads
whatever is exposed now, adds `ops` if it is missing, leaves the rest alone and
tells PostgREST to reload. Running it twice is safe. It prints the result:

```
exposed_schemas
public, graphql_public, ops
```

## Step 3 — make the first account

Passwords move to Supabase Auth, where they belong. The `12345` scheme in the
browser was a lock on the office door; this is the real thing.

1. **Authentication → Users → Add user**: a real email and a password you
   choose, and tick "Auto confirm user".
2. Open `db/bootstrap.sql`, put that email and your name at the top, and run
   it in the SQL editor.

That links the account to an administrator row and fills in the lists behind
the dropdowns — countries, cities, professions, payment sources — and nothing
else. No workers, no requests, no money: those you enter yourself. It can be
run again safely, and it refuses with a clear message if the auth user is not
there yet.

Nobody can read anything until a matching `ops.staff` row exists with
`status = 'Active'`. That is deliberate — it is the same rule the test suite
checks.

## Step 4 — point the app at it

`.env.local` (already gitignored):

```
VITE_SUPABASE_URL=https://ksfsapomxgxbdrwgesde.supabase.co
VITE_SUPABASE_ANON_KEY=<the anon key>
```

The anon key is meant to be public: it ships inside the browser bundle. Its
safety comes from the rules below. The `service_role` key is the opposite of
safe and must never appear in this repository, this app, or any build output.

Then open **Settings → Database** in the dashboard. It says which of four
things is true: not configured, unreachable, reachable but the schema is not
exposed, or connected.

## Step 5 — bring your data across, if it is worth bringing

Skip this if what is in the browser is demo data. An empty database plus
step 3 is a working dashboard; this is only for carrying real records over.

Export first, from **Settings → Database → Export data**. If the project is
already configured and you cannot sign in yet, the sign-in screen offers the
same export — the accounts move to the server before the data does, and that
is exactly when somebody needs to get at what the browser still holds.

### If you have the project on your machine

A terminal, in the folder holding `package.json`:

```bash
npm i -D @electric-sql/pglite --no-save
node scripts/import-local-data.mjs eleutheria-export-2026-09-23.json --pglite

npm i -D pg --no-save
SUPABASE_DB_URL='postgresql://...' node scripts/import-local-data.mjs eleutheria-export-2026-09-23.json
```

The dry run applies the migrations to a throwaway Postgres on your machine and
imports into that, so you can see exactly what would land before anything
touches the project. The connection string is under **Project Settings →
Database → Connection string**; take the URI, and if the direct connection will
not open, use the session pooler one. It contains the database password, so
pass it on the command line rather than putting it in a file here.

Ids are derived from the app's own ids, so importing the same file twice
updates the same rows instead of making a second copy.

Commissions, agency charges and backouts are the exception, and deliberately
so: the triggers create them from the stage log as it is imported, and the file
only says which of them had been settled. So those rows come out of the
database's own reckoning, with the payments you had already recorded against
them.

### If you would rather not open a terminal

The import can be written out as SQL instead, and pasted into the editor like
every other step so far:

```bash
node scripts/import-local-data.mjs eleutheria-export-2026-09-23.json --sql
```

That writes `db/import.sql` — open it in a text editor, select all, paste it
into the SQL editor, run it once. It also writes `db/import-parts/`, the same
import in pieces of about 4 KB, for pasting one at a time if a long paste
arrives truncated.

`scripts/test-import.mjs` runs every route — over a connection, as one file,
and as the pieces — and checks they all land the same database, because a file
that is nearly right is worse than no file at all.

Somebody has to run that one command, though. If there is no terminal at hand
at all, send the export file over and the SQL can be generated for you --
bearing in mind that an export holds passport and identity numbers, so it is
not a file to post anywhere public.

Attachments are the exception. Their bytes live in the browser as data URLs and
Storage is not reachable over a database connection, so each one is written to
`db/exported-files/` and its row keeps the name, type and size with no path.
Upload those to the `bills` bucket and set `attachment_path` when you do.

## Where the money rules live

`0004_derived_billing.sql` puts them in the database. An agent's two halves, a
partner office's two halves and a backout all follow from the stage log, and a
trigger derives them there rather than in the browser.

That moved for a reason that only appears once the roles are real: data entry
may log a stage but may not read finance, so a browser that cannot see a
commission cannot maintain one either. Deriving it in the database means it
happens whoever logs the stage, and there is one copy of the rule instead of
one per client.

The two things it never does are the two the application never did: it does
not change or remove a row whose money has already moved, and it does not
invent a row for a stage that has not happened.
`scripts/test-billing.mjs` checks both, along with the guarantee window, an
office overriding who carries a backout, and a rebuild changing nothing that
was already right.

After an import, or any time you want the books checked against the history:

```sql
select ops.rebuild_derived_billing();
```

## Who can read and what

The three roles the app already had are now the database's rules, which is the
real reason for the move: until now they lived only in the browser, where
anyone who opens the developer tools can edit them.

| | operations | finance | payroll | staff & settings |
| --- | --- | --- | --- | --- |
| **admin** | read, write | read, write | read, write | read, write |
| **accountant** | read | read, write | — | read |
| **data entry** | read, write | — | — | read |
| **anon** (the website) | — | — | — | — |

Payroll is narrower than the rest of finance on purpose: it is what colleagues
earn. And nobody can change their own role or status, administrator or not —
a trigger refuses it, because that is the single edit that would undo
everything above.

`scripts/test-schema.mjs` proves all of this against a real Postgres:

```bash
npm i -D @electric-sql/pglite --no-save
node scripts/test-schema.mjs
```

It applies the migrations, creates one account of each role, then tries every
kind of access from every role and reports what the database actually allowed.
Thirty-one checks, including that an anonymous caller is refused the
applicants table, the money and the staff list.

One thing that surfaced while writing those tests, and which matters for the
app code: **a forbidden `update` or `delete` does not raise an error.** The
policy simply matches no rows, and PostgREST reports success. Any write that
must be confirmed has to check the affected count, not the absence of an
error.

## What the website reads

```
GET https://ksfsapomxgxbdrwgesde.supabase.co/rest/v1/published_workers?select=*
    apikey: <anon key>
```

Or, from the site's own server, a read-only role that can reach nothing else:

```sql
create role website_reader login password '<choose a strong password>';
grant usage on schema public to website_reader;
grant select on public.published_workers to website_reader;
```

The view exposes exactly this and nothing more:

```
id, english_name, arabic_name, gender, age, country, profession,
type, experience_years, photo_path, cv_path, updated_at
```

Date of birth is reduced to an age; passport number, identity number, phone,
telephone and passport copy are absent, and so is every commercial column —
which agency she came through, which agent introduced her, what anybody was
paid. The photograph and the CV are there because the site is meant to show
them. The column list is written out rather than `select *`, so adding a
sensitive column to `ops.applicants` later cannot silently publish it.

### Why it is a function behind a view

Left as a plain view over a locked table, the projection runs with its owner's
rights — which is how an anonymous caller reads it while `ops.applicants` stays
shut. Supabase's database linter reports that as a **security definer view**,
and offers to fix it by setting `security_invoker` on. Accepting that offer
takes the borrowed rights away, the anonymous caller loses its only way in, and
the website goes dark with a permission error. That has happened once here.

So `0007_public_projection.sql` arranges it to leave nothing to fix:

- `ops.published_workers_rows()` does the reading. It is the security definer
  now, with its `search_path` pinned so `ops.applicants` cannot be made to mean
  something else.
- It is owned by `ops_website_reader`, a role that cannot log in and exists for
  this one job, and one policy on `ops.applicants` lets *that role* read a
  published, available row. Row level security is forced on that table, so
  without the policy even an owner reads nothing — and because the policy names
  this role alone, a signed-in stranger gains nothing from it.
- `public.published_workers` is `security_invoker`, so the linter has nothing to
  say about it. The caller needs no rights on any table, only permission to run
  the function.

The upshot: `anon` is granted nothing on `ops.applicants`, and the twelve
columns above are the whole of what the internet can reach. If the linter ever
flags this again, read what it says before accepting a fix — and if the site
does go dark with a permission error, running `0007` again puts it back.

A worker appears on the site when `published_to_website` is true **and** her
status is `Available`, so someone who has been placed drops off the site by
herself. In the dashboard that is the switch beside her status, marked **On the
website**, and the applicants list can be filtered by it.

### Photographs

Two buckets, and the difference between them is the point.
`worker-photos` is private and holds every applicant's photograph, which is
right for a file about somebody nobody has published. Publishing a worker
copies hers into `published-photos`, which anyone may read; unpublishing
removes it again. So what a stranger can fetch is exactly what somebody chose
to put on the website.

The object keeps the same key in both, so `photo_path` from the view is all the
site needs:

```
https://<project>.supabase.co/storage/v1/object/public/published-photos/<photo_path>
```

`photo_path` is null for a worker whose photograph was never uploaded, so the
site needs a placeholder for that case.

### The CV

The same arrangement, one bucket along. The office's upload goes into the
private `worker-documents`, and publishing the worker copies it into
`published-cvs`, which anyone may read:

```
https://<project>.supabase.co/storage/v1/object/public/published-cvs/<cv_path>
```

`cv_path` is on the view, so the site can link straight to it; `cv_file_name`
holds the name the office uploaded and stays inside `ops`, because a visitor
has no use for it.

This is the one place where the dashboard hands a document to strangers, so it
is worth being plain about what it means: while a worker is on the website, her
CV can be read by anyone who has the link, with no key and no sign-in. Nothing
narrows that to people the office knows. Keep passport scans and identity
papers out of the CV -- they belong in `worker-documents`, which is private --
and unpublishing the worker deletes the public copy.

## What is still to build

The schema is the storage half. The application still needs:

- **A data layer.** Every page reads a synchronous array from memory today.
  Server data means loading, error and empty states on each screen.
- **Sign-in against Supabase Auth**, replacing the password check that
  currently runs in the browser.
- **A decision about concurrent edits**, once more than one person is working
  in the app at the same time.

Before that work starts, one thing needs looking at that cannot be seen from
here: **what the website's own tables already hold.** If the site already has
a workers table it reads from, publishing should write to that rather than
adding a second source of truth beside it. To see it:

```bash
node scripts/inspect-schema.mjs                      # what the anon key can see
SUPABASE_DB_URL='postgresql://...' node scripts/inspect-schema.mjs   # everything
```
