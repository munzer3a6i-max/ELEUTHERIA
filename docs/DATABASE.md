# Connecting the dashboard to a database

Today the dashboard keeps everything in the browser's `localStorage` under the
key `mustaqdem-store`. Nothing is shared: each person who opens the app has
their own private copy, and clearing browser data deletes it. This document
covers moving that to a real database and publishing selected workers to
eleutheria.agency.

## The shape

```
  Dashboard (browser)                 Website (eleutheria.agency)
          |                                      |
          | signed-in staff                      | anonymous visitors
          v                                      v
   Supabase Postgres  <-------- published_workers view (read only)
   + Auth + Storage
```

Two audiences, two levels of access. Staff read and write operational data.
The website reads one curated view and nothing else. Passport numbers,
identity numbers, phone numbers, costs and payroll never leave the first box.

## What you need to create

1. **A Supabase project** (free tier is enough to start). Note the project URL
   and the `anon` key from Project Settings, API.
2. **Two storage buckets**, both private: `worker-photos` and `worker-documents`.
   Photos are currently base64 strings inside `localStorage`, which will not
   survive the move.
3. **The schema.** Run these in order in the SQL editor:
   - `db/migrations/0001_init.sql` - tables, indexes, triggers
   - `db/migrations/0002_security.sql` - row level security, the public view
4. **The first staff account.** Create a user in Authentication, then link it:

   ```sql
   insert into staff (user_id, name_en, email, role)
   values ('<the auth user id>', 'Your name', 'you@eleutheria.agency', 'admin');
   ```

   Nobody can read anything until a matching `staff` row exists with
   `status = 'Active'`. That is deliberate.

## What the dashboard needs

Environment variables, set in `.env.local` for development and in the host's
dashboard for production:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

The anon key is safe in the browser. It grants nothing on its own: every table
is behind row level security, and the policies require an active staff row.
The `service_role` key is the opposite of safe and must never appear in this
repository or in any frontend build.

## What the website needs

The site is custom-coded, so the cleanest option is to read from the database
on the server, where no key is exposed to visitors.

**Option A, a read-only Postgres role.** Run once, with your own password:

```sql
create role website_reader login password '<choose a strong password>';
grant usage on schema public to website_reader;
grant select on published_workers to website_reader;
```

That role can read the view and nothing else, so a leaked connection string
exposes only what is already public. Point the website's server at it:

```sql
select id, english_name, gender, age, country, profession, experience_years, photo_path
from published_workers
order by updated_at desc;
```

**Option B, Supabase's REST endpoint**, if you would rather not hold a database
connection:

```
GET https://<project>.supabase.co/rest/v1/published_workers?select=*
    apikey: <anon key>
```

Photos are private objects in storage, so the website should request a signed
URL for `photo_path` server-side rather than linking the bucket directly.

## What decides whether a worker appears on the site

The `applicants.published_to_website` column. A worker shows on the public site
only when that flag is true **and** their status is `Available`, so someone who
has been placed drops off the site automatically.

The app already has this field, as `cvLinkedToWebsite` in
`src/types/index.ts`. It was designed for exactly this and has never been wired
to anything.

## What the public view exposes

Verified against the migration:

```
id, english_name, arabic_name, gender, age, country, profession,
type, experience_years, photo_path, updated_at
```

Date of birth is reduced to an age, and passport number, identity number,
phone, telephone, CV path and passport copy are absent. The view lists its
columns explicitly rather than using `select *`, so adding a sensitive column
to `applicants` later cannot silently publish it. Anything added to that list
becomes world readable, so add deliberately.

## Still to build in the app

The schema is only the storage half. The application still needs:

- **A data layer.** Every page currently reads a synchronous array from memory.
  Server data means loading, error and empty states on each screen.
- **Real sign-in.** The login screen is a stub: its button calls `navigate('/')`.
  There is no password and no session.
- **File upload** to the storage buckets, replacing base64 photos.
- **A migration** of whatever is presently in your browser's `localStorage`.
- **A decision about concurrent edits**, once more than one person is working
  in the app at the same time.

## Testing the schema

The migrations run against a real Postgres, not just a linter:

```bash
npm i -D @electric-sql/pglite --no-save
node scripts/test-schema.mjs
```

It applies both migrations, then asserts that the public view hides every
sensitive column, that it returns only published and available workers, and
that an anonymous caller is refused on the `applicants` table.
