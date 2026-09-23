# Putting the dashboard online

The dashboard is a static site: `npm run build` produces `dist/`, a folder of
files any host can serve. There is no server of ours to run — the database,
the sign-in and the files all live in Supabase, and the browser talks to it
directly.

Two things are not optional:

- **HTTPS.** Passwords are hashed with the browser's WebCrypto, which browsers
  only provide on a secure page. On plain http the sign-in screen cannot work.
  Every host below gives HTTPS by default.
- **Two environment variables**, `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`. Without them the app falls back to storing
  everything in the browser it happens to be open in, which is fine for a
  demonstration and wrong for the office. The anon key is public by design; the
  `service_role` key belongs nowhere near this build.

## Vercel

1. At vercel.com, **Add New… → Project**, and import this repository. If it is
   not offered, give the Vercel account access to it under **Install GitHub
   App → Only select repositories**.
2. Vercel reads `vercel.json` in the repository, so the framework, the build
   command, the output folder and the routing are already set. Leave them.
3. Before the first deploy, open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://ksfsapomxgxbdrwgesde.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | the anon key from Supabase → Project Settings → API |

   Tick Production, Preview and Development for both. Vite bakes these in while
   building, so a variable added after a deploy does nothing until the next one:
   change one, then **Deployments → ⋯ → Redeploy**.
4. Deploy. The first build takes a couple of minutes and ends with a
   `*.vercel.app` address.

### Which branch goes live

Vercel deploys the repository's default branch to production and every other
branch to a preview URL. Merge `claude/stoic-brown-t34jeh` into the default
branch when you want the work live, or change the production branch under
**Settings → Git**.

### A custom domain

**Settings → Domains** — something like `office.eleutheria.agency` keeps the
dashboard off the public site's address while sharing the domain. Vercel shows
the DNS record to add at whoever holds the domain. The certificate is automatic.

## Netlify or Cloudflare Pages

Both work the same way: build command `npm run build`, publish directory `dist`,
the same two environment variables. Each needs the single-page rule that
`vercel.json` already carries here, because the dashboard's routes (`/finance`,
`/applicants/…`) exist only in the browser:

- Netlify — a `_redirects` file in `public/` containing `/*  /index.html  200`.
- Cloudflare Pages — a `_redirects` file with the same line, or the SPA setting.

## When the deployed page comes up blank

Open the browser's console. `Invalid supabaseUrl: Must be a valid HTTP or HTTPS
URL` means `VITE_SUPABASE_URL` reached the build as something that is not an
address — almost always the host pasted without `https://`, or the whole
`VITE_SUPABASE_URL=…` line pasted into the value box.

The app now tidies those up by itself: a missing scheme, surrounding quotes, a
stray space, a trailing slash or a copied endpoint path are all read as the
project they obviously mean. What it cannot repair — a value that is not an
address at all, or a key that was never set — is said plainly on the sign-in
screen instead of a blank page, and it falls back to this browser's own storage
so somebody can still get in and see what is wrong.

Either way the fix is the same: correct the value in the hosting panel and
deploy again, because the value is baked in at build time.

## After the first deploy

1. Open the address and sign in with the administrator email that
   `db/bootstrap.sql` linked, and the password of that Supabase account.
2. **Settings → Users** — add the accountant and the data entry accounts. Each
   person gets a Supabase Auth account and a `staff` row; the role decides what
   they can reach, and the database enforces it, not the browser.
3. Change the starting password from **Account**.
4. In Supabase → **Authentication → URL Configuration**, set the Site URL to the
   deployed address, and add it to **Redirect URLs** as well. Every link
   Supabase emails — confirming an address, resetting a password — is checked
   against those, and falls back to the Site URL, which starts life as
   `http://localhost:3000`. Leave it and a new colleague's confirmation link
   points at their own machine.

   The dashboard asks for the link to come back to whatever address it is being
   used from, so setting these two correctly is usually the whole of it. If an
   office where the administrator sets the passwords has no use for
   confirmation emails at all, turn **Confirm email** off under Authentication,
   Providers, Email, and there is no link to get wrong.

## Checking a build before pushing

```bash
npm run build     # tsc -b && vite build
npm run preview   # serves dist/ at http://localhost:4173
npm run lint
```

`npm run preview` serves over http, so the sign-in screen will refuse to hash a
password there. That is the WebCrypto rule above, not a fault in the build; the
deployed site is on https and works.

## The public website

The site at eleutheria.agency is a separate repository on a separate Vercel
account, and reads the workers the office publishes straight from the database.
Its half is in [`website/`](../website/README.md) — copy that folder in, set the
same two values as `NEXT_PUBLIC_…` or `VITE_…` there, and a worker switched to
**On the website** in the dashboard appears on the next page load.
