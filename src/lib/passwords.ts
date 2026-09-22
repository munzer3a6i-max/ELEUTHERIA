/*
  Passwords, hashed rather than kept.

  This is a browser-only app: everything lives in localStorage, and anyone who
  can open the developer tools can read and rewrite it. So a password here is
  not a security boundary -- it is a lock on the office door that keeps the
  wrong person out of the wrong screen. What it can do honestly is avoid
  storing the password itself, so a stored account never hands over a secret
  that somebody probably reused elsewhere.

  Each account carries its own random salt, and what is saved is
  SHA-256(salt + ':' + password). Verifying re-runs the same sum and compares.
  Real hashing for real accounts (slow, memory-hard, done on a server) arrives
  with the database; see docs/ROLES.md.
*/

import type { StaffCredentials } from '../types'

/** What a new or reset account can sign in with until someone changes it. */
export const DEFAULT_PASSWORD = '12345'

export const MIN_PASSWORD_LENGTH = 5

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return [...buffer].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function randomSalt(): string {
  return randomHex(16)
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Builds a fresh credential record. `temporary` marks a password nobody chose. */
export async function makeCredentials(password: string, temporary = false): Promise<StaffCredentials> {
  const salt = randomSalt()
  return {
    salt,
    hash: await hashPassword(password, salt),
    temporary,
    updatedOn: new Date().toISOString().slice(0, 10),
  }
}

export async function verifyPassword(password: string, credentials: StaffCredentials | null): Promise<boolean> {
  if (!credentials?.hash) return false
  return (await hashPassword(password, credentials.salt)) === credentials.hash
}

/** Why a chosen password is unacceptable, or null when it is fine. */
export function passwordProblem(password: string, language: 'en' | 'ar'): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return language === 'ar'
      ? `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} خانات على الأقل.`
      : `A password needs at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

/**
 * Usernames are how people sign in, so they are compared without case and
 * cannot collide.
 */
export function normaliseUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function usernameProblem(
  username: string,
  taken: string[],
  language: 'en' | 'ar',
): string | null {
  const value = normaliseUsername(username)
  if (value.length < 3) {
    return language === 'ar' ? 'اسم المستخدم قصير جدًا.' : 'That username is too short.'
  }
  if (!/^[a-z0-9._-]+$/.test(value)) {
    return language === 'ar'
      ? 'استخدم الحروف الإنجليزية والأرقام والنقطة والشرطة فقط.'
      : 'Use letters, numbers, dots, dashes and underscores only.'
  }
  if (taken.map(normaliseUsername).includes(value)) {
    return language === 'ar' ? 'اسم المستخدم مستخدم بالفعل.' : 'Somebody already has that username.'
  }
  return null
}
