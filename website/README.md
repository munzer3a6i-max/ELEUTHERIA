# The workers page for eleutheria.agency

The website lives in another repository, so this folder is the part of it that
belongs to the dashboard: copy `eleutheria/` into the site's source and the
workers the office publishes appear on the site.

## How a worker gets there

1. In the dashboard, open the worker and turn the switch beside her status to
   **On the website**.
2. That sets one column, and she appears in `public.published_workers`, a view
   holding nothing but name, gender, age, country, profession, kind, years of
   experience, the jobs she has done, the photograph and the CV. Her passport number, identity number,
   phone, other documents and every money row stay behind row level security.
3. Her photograph and her CV are copied into the public `published-photos` and
   `published-cvs` buckets. Turning the switch off deletes both again and takes
   her out of the view.

Nothing is rebuilt or deployed in between. The site reads the view live, so she
is there on the next page load and gone within one of being unpublished. Only
workers whose status is still **Available** are listed, so a worker who has been
selected or deployed drops off the site by herself.

## Installing it

1. Copy the `eleutheria` folder into the site (`src/eleutheria`, or wherever
   components live).
2. Open `eleutheria/config.ts` and either paste the project URL and anon key, or
   uncomment the two lines matching the framework and set the environment
   variables on the site's Vercel project:

   | Framework | Variables |
   | --- | --- |
   | Vite | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
   | Next | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

   Set them for Production, Preview and Development, then redeploy — Vercel bakes
   them in at build time, so an existing deployment will not pick them up.
3. Add the page to a route:

   ```tsx
   import { WorkersPage } from './eleutheria/WorkersPage'

   export default function Workers() {
     return <WorkersPage language="ar" />
   }
   ```

   On Next's app router put `'use client'` at the top of that file: the page
   fetches in the browser and keeps filter state.

No new dependency is needed. It talks to Supabase over `fetch`; if the site
already uses `@supabase/supabase-js`, the same query is
`supabase.from('published_workers').select('*')`.

## The files

| File | What it is |
| --- | --- |
| `config.ts` | The project URL and anon key. Both are public; the service_role key must never appear here. |
| `workers.ts` | The `Worker` and `WorkerJob` types, `fetchWorkers()`, and `photoUrl()` / `cvUrl()` for the public photograph and CV addresses. |
| `useWorkers.ts` | A hook: loads, reloads, cancels a request the filters have overtaken. |
| `WorkersPage.tsx` | The page itself — search, three filters, cards, and the loading, empty and failed states. |
| `workers.css` | Plain classes, laid out with logical properties so it flips for Arabic. Replace it with the site's own styling if you prefer. |

## Using the data with your own markup

If the site already has a design for this page, skip `WorkersPage.tsx` and take
the data:

```tsx
import { useWorkers } from './eleutheria/useWorkers'
import { photoUrl } from './eleutheria/workers'

const { workers, loading, error } = useWorkers({ type: 'Domestic' })
```

`photoUrl(worker)` returns an ordinary image address, or `null` when she has no
photograph, so `<img src>` needs nothing else. `cvUrl(worker)` is the same for
the CV: a link to open, or `null` when there is none published.

## Showing something else about a worker

The view is the fence: anything listed in it is world readable, anything not
listed cannot be reached with the anon key however the site asks. To publish one
more field, add the column to `public.published_workers` in
`db/migrations/0002_security.sql`, run that statement, and add it to the `Worker`
interface. Add columns to it deliberately, one at a time.
