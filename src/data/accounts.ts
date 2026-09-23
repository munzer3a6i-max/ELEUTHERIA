/*
  Making somebody an account they can actually sign in with.

  A staff row says what a person may do; it is not what lets them in. Connected,
  the password lives in Supabase Auth, and until an auth user exists and the
  staff row points at it, a new colleague is refused at the door with no
  explanation that makes sense to them.

  So adding a user creates the auth account first and carries its id into the
  staff row. It is done through an isolated client, because signing somebody up
  signs them in, and the administrator doing the adding must not be thrown out
  of their own session to make room.

  Deleting is the half that cannot be done from here: removing an auth user
  needs the service_role key, which has no business in a browser. Removing the
  staff row takes away everything the account could do, which is the part that
  matters; the account itself is deleted in the Supabase dashboard.
*/

import { isolatedClient, supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { loadEverything } from './sync'

export type AccountOutcome =
  | 'ok'
  /** Made, but Supabase is set to make them confirm the address first. */
  | 'needs-confirmation'
  | 'email-taken'
  /** The project has new sign-ups switched off, so nothing can be created. */
  | 'signups-disabled'
  | 'invalid-email'
  | 'weak-password'
  | 'unreachable'

export interface AccountResult {
  outcome: AccountOutcome
  /** The auth user to point a staff row at, when there is one. */
  userId: string | null
  /** What the server said, for the cases nothing above covers. */
  detail?: string
}

export async function createAccount(email: string, password: string): Promise<AccountResult> {
  const client = isolatedClient()
  if (!client) return { outcome: 'unreachable', userId: null }

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      // Where the confirmation link should land. Without this, Supabase sends
      // people to the project's Site URL, which starts life as
      // http://localhost:3000 and stays there until somebody changes it -- so
      // the link in a new colleague's inbox points at their own machine. This
      // is the dashboard they are being added to, whichever address it is
      // served from. Supabase still checks it against the project's allowed
      // redirect list, so the Site URL is worth setting correctly as well.
      emailRedirectTo: typeof window === 'undefined' ? undefined : `${window.location.origin}/login`,
    },
  })

  if (error) {
    const said = error.message
    if (/already registered|already exists|user_repeated/i.test(said)) {
      return { outcome: 'email-taken', userId: null }
    }
    if (/signup|sign-up|sign up/i.test(said) && /disabled|not allowed/i.test(said)) {
      return { outcome: 'signups-disabled', userId: null, detail: said }
    }
    if (/password/i.test(said)) return { outcome: 'weak-password', userId: null, detail: said }
    if (/email/i.test(said)) return { outcome: 'invalid-email', userId: null, detail: said }
    return { outcome: 'unreachable', userId: null, detail: said }
  }

  // With confirmations on, signing up with an address that already exists is
  // answered with a user and an empty identities list rather than an error, so
  // that a stranger cannot learn who has an account. Read it as taken.
  if (!data.user || (data.user.identities ?? []).length === 0) {
    return { outcome: 'email-taken', userId: null }
  }

  // No session means the project asks for the address to be confirmed. The
  // account is real and the staff row should still point at it; they simply
  // cannot sign in until they follow the link.
  if (!data.session) return { outcome: 'needs-confirmation', userId: data.user.id }

  // Nothing of the new session is kept, but ending it is tidier than leaving a
  // token on a client that is about to be dropped.
  await client.auth.signOut()
  return { outcome: 'ok', userId: data.user.id }
}

export interface LinkResult {
  /** How many staff rows were joined to an account by this call. */
  linked: number
  /** Who is still without one, by username. */
  unlinked: string[]
  error?: string
}

/**
 * Points every staff row with no account at the one with the same address.
 *
 * The matching is done in the database, because reading auth.users needs
 * rights no browser has. It refuses anyone who is not an administrator, skips
 * a row with no address rather than guessing, and never hands an account that
 * already belongs to somebody to a second row.
 */
export async function linkAccounts(): Promise<LinkResult> {
  const client = supabase
  if (!client) return { linked: 0, unlinked: [], error: 'No project is configured.' }

  const { data, error } = await client.rpc('link_staff_accounts')
  if (error) return { linked: 0, unlinked: [], error: error.message }

  const rows = (data ?? []) as { username: string; linked: boolean }[]
  const result = {
    linked: rows.filter((r) => r.linked).length,
    unlinked: rows.filter((r) => !r.linked).map((r) => r.username),
  }

  // The staff list in hand still says nobody is linked; read it back so the
  // page shows what the database now holds.
  const loaded = await loadEverything()
  useAppStore.setState({ staff: loaded.staff })

  return result
}
