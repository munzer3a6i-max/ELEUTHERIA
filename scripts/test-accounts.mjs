// Checks what the dashboard makes of Supabase Auth's answers when an
// administrator adds a user.
//
//   npx esbuild --version >/dev/null && node scripts/test-accounts.mjs
//
// The answers are the awkward part. Signing somebody up can succeed with a
// session, succeed without one because the project wants the address
// confirmed, or "succeed" with an empty identities list, which is how Supabase
// says the address is taken without telling a stranger so. Each has to reach
// the administrator as something they can act on, and that mapping is what is
// tested here -- against a stand-in for GoTrue rather than a mock of our own
// code, so the supabase-js client in the middle is the real one.

import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 4630
const work = mkdtempSync(join(tmpdir(), 'eleutheria-accounts-'))
const entry = join(work, 'entry.ts')
const bundle = join(work, 'bundle.js')

// The module reads its configuration from import.meta.env, so it is bundled
// the way the browser gets it, pointed at the stand-in below.
const { writeFileSync } = await import('node:fs')
writeFileSync(
  entry,
  `import { createAccount } from '${process.cwd()}/src/data/accounts'\n` +
    'globalThis.runCase = (email, password) => createAccount(email, password)\n',
)

try {
  execFileSync(
    'npx',
    [
      'esbuild', entry, '--bundle', `--outfile=${bundle}`, '--format=esm', '--platform=node',
      `--define:import.meta.env={"VITE_SUPABASE_URL":"http://localhost:${PORT}","VITE_SUPABASE_ANON_KEY":"test-anon-key"}`,
    ],
    { stdio: 'pipe' },
  )
} catch (error) {
  console.log('could not bundle the module for testing:\n', String(error.stderr ?? error.message))
  rmSync(work, { recursive: true, force: true })
  process.exit(1)
}

let mode = 'ok'
const user = { id: '00000000-1111-2222-3333-444444444444', email: 'x@y.z', identities: [{ id: 'i' }] }

const server = createServer((request, response) => {
  request.on('data', () => {})
  request.on('end', () => {
    const send = (status, payload) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify(payload))
    }
    if (request.url.startsWith('/auth/v1/logout')) return send(204, {})

    if (mode === 'ok') {
      const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
      const exp = Math.floor(Date.now() / 1000) + 3600
      const jwt = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user.id, role: 'authenticated', exp })}.sig`
      const session = { access_token: jwt, refresh_token: 'r', expires_in: 3600, expires_at: exp, token_type: 'bearer', user }
      return send(200, { ...session, session })
    }
    // Confirmations on: an account, but no session until they follow the link.
    if (mode === 'confirm') return send(200, { user, session: null })
    // Confirmations on and the address already taken: no error, no identities.
    if (mode === 'taken-quiet') return send(200, { user: { ...user, identities: [] }, session: null })
    if (mode === 'taken-loud') return send(400, { code: 422, error_code: 'user_already_exists', msg: 'User already registered', message: 'User already registered' })
    if (mode === 'signups-off') return send(422, { code: 422, error_code: 'signup_disabled', msg: 'Signups not allowed for this instance', message: 'Signups not allowed for this instance' })
    if (mode === 'weak') return send(422, { code: 422, error_code: 'weak_password', msg: 'Password should be at least 6 characters', message: 'Password should be at least 6 characters' })
    if (mode === 'bad-email') return send(400, { code: 400, msg: 'Unable to validate email address: invalid format', message: 'Unable to validate email address: invalid format' })
    return send(500, { message: 'boom' })
  })
}).listen(PORT)

await import(`file://${bundle}`)

let failures = 0
function check(passed, label, detail = '') {
  console.log(`${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!passed) failures += 1
}

const expected = {
  ok: 'ok',
  confirm: 'needs-confirmation',
  'taken-quiet': 'email-taken',
  'taken-loud': 'email-taken',
  'signups-off': 'signups-disabled',
  weak: 'weak-password',
  'bad-email': 'invalid-email',
  boom: 'unreachable',
}

for (const [when, want] of Object.entries(expected)) {
  mode = when
  const got = await globalThis.runCase('someone@example.com', 'sixchars')
  check(got.outcome === want, `${when} is read as ${want}`, got.outcome === want ? '' : `got ${got.outcome}`)

  // An account with nowhere to point is the bug that started this: a staff row
  // with no user_id is a name in a list that nobody can sign in as.
  if (when === 'ok' || when === 'confirm') {
    check(got.userId === user.id, `${when} carries the auth id into the staff row`)
  }
  if (when === 'taken-quiet') check(got.userId === null, 'a taken address links no row')
}

server.close()
rmSync(work, { recursive: true, force: true })
console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nall checks passed')
process.exit(failures ? 1 : 0)
