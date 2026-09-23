# Brief for the website's repository

The other half of this work happens in the site's own repository, which this one
cannot see. Paste the brief below into that session. It is written to stand on
its own: everything the site needs to know about the database is in it, and
nothing in it depends on reading this repository.

If it is easier to carry the code across than to have it written again,
`website/eleutheria/` here is a working implementation — copy the folder in and
the brief becomes a description of what you already have.

---

## The task

Add a page to this site listing the domestic workers and skilled workers the
agency's office has published. The office runs a separate dashboard; marking a
worker "On the website" there is what puts her here. The site reads the database
directly and live — there is no API of ours to call, no webhook, and nothing to
rebuild between the office publishing a worker and her appearing on the site.

## Where the data comes from

A Supabase project. Two values are needed, both public by design:

- `SUPABASE_URL` — `https://ksfsapomxgxbdrwgesde.supabase.co`
- `SUPABASE_ANON_KEY` — the anon key, from Supabase → Project Settings → API

Put them in this project's environment variables on Vercel (`NEXT_PUBLIC_…` or
`VITE_…` to match the framework), set for Production, Preview and Development,
and remember that both Next and Vite bake them in at build time: a variable
added after a deploy does nothing until the next one.

The anon key is meant to ship in the browser bundle. Its safety comes from row
level security on every table, so it can read exactly the one view below and
the one public storage bucket, and nothing else. There is also a `service_role`
key in that same Supabase page: it bypasses all of it and must never appear in
this repository, this site, or any build output. If something seems to need it,
that is a sign to stop and ask, not to paste it in.

## The one thing it may read

A view, `public.published_workers`. These are all of its columns:

| Column | Type | Note |
| --- | --- | --- |
| `id` | uuid | |
| `english_name` | text | |
| `arabic_name` | text | May be an empty string. |
| `gender` | text | `Male` or `Female`. |
| `age` | int \| null | Years. The date of birth itself is not exposed. |
| `country` | text | Free text, e.g. `Ethiopia`. |
| `profession` | text | Free text, e.g. `Housemaid`, `Driver`. |
| `type` | text | `Domestic` or `Profession` (i.e. a skilled worker). |
| `experience_years` | int | |
| `photo_path` | text \| null | A key inside the `published-photos` bucket. |
| `updated_at` | timestamptz | |

The view already filters: it holds only workers whose office record is both
published and still `Available`, so a worker who has been selected or deployed
leaves the site by herself. Do not add a status filter of your own.

Nothing else is reachable. Passport numbers, identity numbers, phone numbers,
documents, agencies, agents and every money row exist in that database and are
behind row level security; no query written here can reach them, whatever it
asks for. Do not invent columns — anything not in the table above will come back
empty or as an error. If the page needs one more field, say so and the office
side will add it to the view deliberately; it cannot be done from this repo.

## Reading it

Plain fetch, if you would rather not add a dependency:

```
GET {SUPABASE_URL}/rest/v1/published_workers?select=*&order=updated_at.desc&limit=200
    apikey: {SUPABASE_ANON_KEY}
    Authorization: Bearer {SUPABASE_ANON_KEY}
```

It is PostgREST, so server-side filtering is query parameters —
`country=eq.Ethiopia`, `type=eq.Domestic`,
`or=(english_name.ilike.*ana*,arabic_name.ilike.*ana*)`. The list is small
(tens, not thousands), so fetching it once and filtering in the browser is
perfectly reasonable and makes the dropdowns instant.

If this site already uses `@supabase/supabase-js`, the same query is
`supabase.from('published_workers').select('*')`. No sign-in, no session; these
rows are readable by anyone with the anon key, which is the point.

## Photographs

The bucket is public, so a photograph is an ordinary image address:

```
{SUPABASE_URL}/storage/v1/object/public/published-photos/{photo_path}
```

`photo_path` is null for a worker without one — show a placeholder rather than a
broken image. Unpublishing a worker in the office deletes the file from this
bucket, which is deliberate: what is publicly readable is exactly what somebody
chose to publish.

## What the page should do

Match this site's existing design, language handling and routing — those
conventions win over anything suggested here.

- A card per worker: photograph, name, profession, country, age, years of
  experience.
- Use `arabic_name` when the site is in Arabic and `english_name` otherwise,
  falling back to the English name when the Arabic one is empty.
- Filters worth having: search by name, country, profession, and Domestic vs
  skilled. Build the country and profession lists from the rows that came back,
  not from a hard-coded list — the office adds countries as it works with them.
- Four states, all of which will happen: loading, the list, nothing published
  yet, and the fetch failed. Nothing published is not an error; say so plainly
  and leave the filters alone.
- Cancel an in-flight request when the filters change, so a slow reply cannot
  overwrite a newer one.
- On Next's app router the page needs `'use client'` — it fetches in the browser
  and keeps filter state. A server-rendered version works too, and then the
  anon key can stay server-side; either is fine.

## Checking it

Run the site and load the page against the real project. If the list is empty,
that is most likely correct — it means the office has not switched anyone on
yet, not that the query is wrong. Ask them to publish one worker and reload.
A 401 or 404 means the URL or the key is wrong; a 200 with `[]` means the query
is right and there is nothing published.
