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

/*
  These two values arrive from a hosting panel where somebody typed them in by
  hand, so they arrive with whatever came along: a trailing space, the quotes
  that belong to an .env file's syntax, the whole `NAME=value` line pasted into
  the value box, an address with no scheme or with a path still on the end.
  None of that is worth a white screen, so it is cleaned up here.
*/
function tidy(raw: string | undefined, name: string): string {
  if (typeof raw !== 'string') return ''
  let text = raw.trim()
  if (text.startsWith(`${name}=`)) text = text.slice(name.length + 1).trim()
  const quote = text[0]
  if ((quote === '"' || quote === "'") && text.length > 1 && text.endsWith(quote)) {
    text = text.slice(1, -1).trim()
  }
  return text
}

/** The project's base address, or an empty string if it cannot be one. */
function projectUrl(raw: string): string {
  if (!raw) return ''
  // A bare host is the usual paste, and https is the only thing it can mean.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const parsed = new URL(withScheme)
    // Browsers are forgiving where this should not be: a space inside a host is
    // percent-encoded rather than refused, so `my supabase project` parses into
    // an address that resolves nowhere. A host is letters, digits, hyphens and
    // dots, and anything else is somebody's note to themselves, not an address.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/i.test(parsed.hostname)) return ''
    // Anything past the host is somebody's copied endpoint; the client wants
    // the project, and adds the rest of the path itself.
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return ''
  }
}

const rawUrl = tidy(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
const anonKey = tidy(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')
const url = projectUrl(rawUrl)

/**
 * Set when the project is half configured: a value is there but cannot be used.
 * Both missing is not a problem, it is the local fallback the app is built for,
 * and saying nothing about it keeps the demonstration quiet. One missing or one
 * unusable is somebody's mistake in a hosting panel, and the sign-in screen
 * says so rather than falling back to this browser's own storage in silence.
 */
export const configurationProblem: 'bad-url' | 'missing-key' | null = rawUrl && !url
  ? 'bad-url'
  : url && !anonKey
    ? 'missing-key'
    : null

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

/**
 * A second client, for work that must not disturb whoever is signed in.
 *
 * Creating an account is the case that needs it: `signUp` signs the new user
 * in, and on the shared client that would throw the administrator out of their
 * own session halfway through adding somebody. This one keeps nothing and
 * remembers nothing, so the session it opens dies with the call.
 */
export function isolatedClient() {
  if (!isSupabaseConfigured) return null
  return createClient(url, anonKey, {
    db: { schema: 'ops' },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'eleutheria-isolated',
    },
  })
}

/** Narrow the client where a caller genuinely requires a configured project. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env.local and fill in the project URL and anon key.',
    )
  }
  return supabase
}
