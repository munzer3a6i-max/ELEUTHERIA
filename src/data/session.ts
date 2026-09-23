/*
  Signing in, wherever the accounts happen to live.

  Connected, that is Supabase Auth: a real server checks the password, and the
  staff row it lands on decides what the person may do. On its own, it is the
  hashed password in the browser, which is what the app had before a database
  existed. The screens do not need to know which, only that they hand over an
  identifier and a password and get an answer.
*/

import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { connect, disconnect } from './sync'

export type SignInOutcome =
  | 'ok'
  | 'wrong-password'
  | 'inactive'
  | 'unknown-user'
  /** The password was right, but no staff row points at this account yet. */
  | 'unlinked'
  | 'unreachable'

export async function signIn(identifier: string, password: string): Promise<SignInOutcome> {
  if (!isSupabaseConfigured || !supabase) {
    return useAppStore.getState().signIn(identifier, password)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier.trim(),
    password,
  })
  if (error || !data.user) {
    // A wrong address and a wrong password give the same answer, on purpose.
    return /fetch|network/i.test(error?.message ?? '') ? 'unreachable' : 'wrong-password'
  }

  try {
    await connect()
  } catch (problem) {
    await supabase.auth.signOut()
    return problem instanceof Error && /permission|denied/i.test(problem.message) ? 'unlinked' : 'unreachable'
  }

  const member = useAppStore.getState().staff.find((m) => m.userId === data.user.id)
  if (!member) {
    await supabase.auth.signOut()
    disconnect()
    return 'unlinked'
  }
  if (member.status !== 'Active') {
    await supabase.auth.signOut()
    disconnect()
    return 'inactive'
  }

  useAppStore.setState({ currentStaffId: member.id })
  return 'ok'
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
    disconnect()
  }
  useAppStore.getState().signOut()
}

/**
 * Picks up a session left over from last time, so a reload does not ask for a
 * password again. Returns true when somebody is signed in.
 */
export async function resumeSession(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return Boolean(useAppStore.getState().currentStaffId)

  const { data } = await supabase.auth.getSession()
  if (!data.session) return false

  try {
    await connect()
  } catch {
    return false
  }

  const member = useAppStore.getState().staff.find((m) => m.userId === data.session!.user.id)
  if (!member || member.status !== 'Active') {
    await supabase.auth.signOut()
    disconnect()
    return false
  }
  useAppStore.setState({ currentStaffId: member.id })
  return true
}
