// Prints what the Supabase project actually contains, so the next piece of
// work is built against the real thing rather than an assumed one.
//
//   node scripts/inspect-schema.mjs
//     Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local. Shows
//     what an anonymous caller can see -- which is the same access anyone gets
//     from the key that ships inside the website's JavaScript.
//
//   SUPABASE_DB_URL='postgresql://...' node scripts/inspect-schema.mjs
//     Connects to the database directly and shows everything: every schema,
//     every table, the row counts, and which of them have row level security.
//
// Read only either way. Nothing is created, altered or dropped.

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

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

// ------------------------------------------------------ the full picture ---

if (env.SUPABASE_DB_URL) {
  let Client
  try {
    Client = createRequire(import.meta.url)('pg').Client
  } catch {
    console.error('Install the driver first:  npm i -D pg --no-save')
    process.exit(1)
  }
  const client = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log(`${env.SUPABASE_DB_URL.replace(/:[^:@/]+@/, ':****@')}\n`)

  const { rows: tables } = await client.query(`
    select n.nspname as schema, c.relname as name, c.relkind as kind, c.relrowsecurity as rls,
           coalesce(s.n_live_tup, 0) as rows
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_stat_user_tables s on s.relid = c.oid
     where c.relkind in ('r', 'v', 'm')
       and n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast', 'extensions', 'graphql', 'graphql_public', 'net', 'pgsodium', 'pgsodium_masks', 'vault', 'realtime', 'supabase_functions', 'supabase_migrations', '_realtime')
     order by n.nspname, c.relname
  `)

  let current = null
  for (const table of tables) {
    if (table.schema !== current) {
      current = table.schema
      console.log(`\n  ${current}`)
    }
    const kind = table.kind === 'r' ? 'table' : table.kind === 'v' ? 'view ' : 'matv '
    const lock = table.kind === 'r' ? (table.rls ? 'rls' : 'OPEN') : ''
    console.log(`    ${kind} ${table.name.padEnd(30)} ${String(table.rows).padStart(7)} rows  ${lock}`)
  }

  console.log('\n\nColumns of everything outside ops (this is the website\'s own data)\n')
  const { rows: columns } = await client.query(`
    select table_schema, table_name, column_name, data_type
      from information_schema.columns
     where table_schema not in ('pg_catalog', 'information_schema', 'ops')
       and table_schema in (select nspname from pg_namespace where nspname in ('public'))
     order by table_name, ordinal_position
  `)
  let currentTable = null
  for (const column of columns) {
    if (column.table_name !== currentTable) {
      currentTable = column.table_name
      console.log(`\n  ${column.table_schema}.${currentTable}`)
    }
    console.log(`    ${column.column_name.padEnd(30)} ${column.data_type}`)
  }
  console.log(`
A table marked OPEN has no row level security. If the anon key can reach its
schema, everything in it is world readable.
`)
  await client.end()
  process.exit(0)
}

// --------------------------------------------- what the anon key can see ---

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, or SUPABASE_DB_URL for the full picture.')
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
