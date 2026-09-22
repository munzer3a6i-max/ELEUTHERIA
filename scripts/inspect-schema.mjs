// Prints what the Supabase project actually contains, so the dashboard can be
// built against the real tables rather than assumed ones.
//
//   node scripts/inspect-schema.mjs
//
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local or the
// environment. Read only: it lists tables and columns, then checks which of
// them an anonymous caller can read, which is the same access anyone gets from
// the key that ships inside the website's JavaScript.

import { readFileSync } from 'node:fs'

function loadEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (match) env[match[1]] ??= match[2].trim()
    }
  } catch {
    // No .env.local: rely on the process environment.
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local first.')
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

let spec
try {
  const response = await fetch(`${url}/rest/v1/`, { headers })
  if (!response.ok) {
    console.error(`The API answered ${response.status} ${response.statusText}.`)
    console.error(await response.text())
    process.exit(1)
  }
  spec = await response.json()
} catch (error) {
  console.error('Could not reach the project:', error.message)
  console.error('Check the URL, and that the network allows *.supabase.co.')
  process.exit(1)
}

const tables = Object.entries(spec.definitions ?? {})
if (tables.length === 0) {
  console.log('The API exposes no tables to this key.')
  console.log('Either the schema is empty, or nothing is granted to the anon role.')
  process.exit(0)
}

console.log(`${url}\n${tables.length} table(s) visible to the anon key\n`)

for (const [name, definition] of tables) {
  const columns = Object.entries(definition.properties ?? {}).map(([column, meta]) => {
    const type = meta.format ?? meta.type ?? '?'
    const pk = /primary key/i.test(meta.description ?? '') ? ' PK' : ''
    const fk = (meta.description ?? '').match(/<fk table='([^']+)' column='([^']+)'\/>/)
    return `    ${column.padEnd(28)} ${type}${pk}${fk ? `  -> ${fk[1]}.${fk[2]}` : ''}`
  })
  console.log(`  ${name}`)
  console.log(columns.join('\n') || '    (no columns reported)')
  console.log()
}

console.log('Anonymous read check')
console.log('Anyone holding the anon key can do exactly this much:\n')

for (const [name] of tables) {
  let verdict
  try {
    const response = await fetch(`${url}/rest/v1/${encodeURIComponent(name)}?select=*&limit=1`, { headers })
    if (response.ok) {
      const rows = await response.json()
      verdict = `READABLE  (returned ${rows.length} row${rows.length === 1 ? '' : 's'})`
    } else {
      verdict = `blocked   (${response.status})`
    }
  } catch (error) {
    verdict = `error     (${error.message})`
  }
  console.log(`  ${name.padEnd(32)} ${verdict}`)
}

console.log(`
A table marked READABLE is world readable: the anon key is published in the
website's bundle, so anything it can read, any visitor can read. That is
correct for a public workers listing and wrong for anything else.
`)
