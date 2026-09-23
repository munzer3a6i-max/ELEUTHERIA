/*
  Is the database actually there?

  Four things can be true, and the difference matters when something is wrong:
  the project is not configured at all; it is configured but unreachable; it
  answers but the `ops` schema is not exposed; or everything works and there is
  simply nobody signed in yet.
*/

import { supabase, isSupabaseConfigured } from './supabase'

export type ConnectionState =
  | { kind: 'unconfigured' }
  | { kind: 'checking' }
  | { kind: 'ok'; staff: number; signedIn: boolean }
  | { kind: 'schema-missing'; detail: string }
  | { kind: 'unreachable'; detail: string }

/** A blocked or dead host can take minutes to fail, so it is given seconds. */
const TIMEOUT_MS = 8000

function timeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('The project did not answer within 8 seconds.')), TIMEOUT_MS),
    ),
  ])
}

export async function checkConnection(): Promise<ConnectionState> {
  if (!isSupabaseConfigured || !supabase) return { kind: 'unconfigured' }

  try {
    const { data: session } = await supabase.auth.getSession()
    // The query builder is a thenable rather than a promise, so it is wrapped
    // before it can be raced against the clock.
    const { count, error } = await timeout(
      Promise.resolve(supabase.from('staff').select('id', { count: 'exact', head: true })),
    )

    if (error) {
      // PostgREST says 404-ish when the schema is not exposed, and PGRST301 or
      // 42501 when it is there but the caller may not read it. The second is a
      // working connection with nobody signed in.
      const missing = /schema|does not exist|not find/i.test(error.message)
      return missing
        ? { kind: 'schema-missing', detail: error.message }
        : { kind: 'ok', staff: 0, signedIn: Boolean(session.session) }
    }

    return { kind: 'ok', staff: count ?? 0, signedIn: Boolean(session.session) }
  } catch (error) {
    return { kind: 'unreachable', detail: error instanceof Error ? error.message : String(error) }
  }
}

/** Everything in the browser's store, as a file the import script understands. */
export function exportLocalData(): void {
  const raw = localStorage.getItem('mustaqdem-store') ?? '{}'
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `eleutheria-export-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
