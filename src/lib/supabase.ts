import { createClient } from '@supabase/supabase-js'

/*
  The single Supabase client.

  The anon key is published: it ships inside the browser bundle, so it is not
  a secret and never needs hiding. What keeps data safe is row level security
  on every table, which is why the dashboard's own tables grant nothing until
  a signed-in user has an active row in `staff`.

  The service_role key bypasses all of that and must never appear in this
  application, in this repository, or in any build output.
*/

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False when the project is not configured yet, so the app can fall back. */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      // The dashboard's own tables live in `ops`, away from whatever the
      // website already keeps in `public`. The schema has to be listed under
      // Project Settings, API, Exposed schemas for PostgREST to serve it.
      db: { schema: 'ops' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The dashboard is a normal page, not an OAuth callback target.
        detectSessionInUrl: false,
      },
    })
  : null

/** Narrow the client where a caller genuinely requires a configured project. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env.local and fill in the project URL and anon key.',
    )
  }
  return supabase
}
