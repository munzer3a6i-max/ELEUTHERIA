// The two ways of carrying a browser's data into the database, checked against
// each other.
//
//   npm run dev          (in another terminal)
//   node scripts/test-import.mjs
//
// One writes rows over a database connection; the other writes a .sql file for
// somebody who would rather not open a terminal. They have to land the same
// database, or the second is a trap.

import { PGlite } from '@electric-sql/pglite'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.APP_URL ?? 'http://localhost:5180'
let failures = 0
const check = (passed, label, detail = '') => {
  console.log(`${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!passed) failures += 1
}

// --- an export, straight out of the app ------------------------------------
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
const exported = await page.evaluate(async () => {
  const { useAppStore } = await import('/src/store/useAppStore.ts')
  return JSON.stringify({ state: useAppStore.getState() })
})
await browser.close()

const scratch = mkdtempSync(join(tmpdir(), 'eleutheria-'))
const file = join(scratch, 'export.json')
writeFileSync(file, exported)

const TABLES = [
  'countries', 'cities', 'professions', 'payment_sources', 'staff', 'agencies', 'agents', 'employers',
  'applicants', 'applicant_experience', 'applicant_education', 'applicant_documents', 'applicant_notes',
  'requests', 'request_status_history', 'invoices', 'invoice_payments', 'payroll_entries', 'office_expenses',
  'agency_contracts', 'agency_charges', 'agent_commissions', 'backouts', 'backout_costs', 'notifications',
]

async function freshDatabase() {
  const db = new PGlite()
  await db.waitReady
  await db.exec(`
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    end $$;
  `)
  for (const migration of ['0001_schema', '0002_security', '0004_derived_billing']) {
    await db.exec(readFileSync(`db/migrations/${migration}.sql`, 'utf8'))
  }
  return db
}

const shapeOf = async (db) => {
  const counts = {}
  for (const table of TABLES) counts[table] = (await db.query(`select count(*)::int n from ops.${table}`)).rows[0].n
  return counts
}

// --- over a connection -----------------------------------------------------
rmSync('db/.pglite-dryrun', { recursive: true, force: true })
execFileSync('node', ['scripts/import-local-data.mjs', file, '--pglite'], { stdio: 'pipe' })
const overConnection = new PGlite('db/.pglite-dryrun')
await overConnection.waitReady
const direct = await shapeOf(overConnection)
check(Object.values(direct).reduce((a, b) => a + b, 0) > 0, 'the import writes rows over a connection',
  `${Object.values(direct).reduce((a, b) => a + b, 0)} rows`)

// --- as a file to paste ----------------------------------------------------
execFileSync('node', ['scripts/import-local-data.mjs', file, '--sql'], { stdio: 'pipe' })
const sql = readFileSync('db/import.sql', 'utf8')
const pasted = await freshDatabase()
let broke = null
try {
  await pasted.exec(sql)
} catch (error) {
  broke = error.message.split('\n')[0]
}
check(broke === null, 'and the same import as a file runs clean', broke ?? '')

const viaFile = await shapeOf(pasted)
const differ = TABLES.filter((t) => direct[t] !== viaFile[t])
check(differ.length === 0, 'both land the same database',
  differ.map((t) => `${t}: ${viaFile[t]} vs ${direct[t]}`).join(', '))

// --- the things the database works out for itself ---------------------------
const settled = await pasted.query(`select status, count(*)::int n from ops.agency_charges group by status order by status`)
check(settled.rows.some((r) => r.status === 'Paid'),
  'the charges the triggers derived come back with the payments already recorded against them',
  JSON.stringify(settled.rows))

const orphans = await pasted.query(
  `select count(*)::int n from ops.backout_costs c
    where not exists (select 1 from ops.backouts b where b.id = c.backout_id)`)
check(orphans.rows[0].n === 0, "a backout's bills are attached to the row the trigger opened")

// --- and the same import in pieces ------------------------------------------
// A piece that is cut in the wrong place would still run and build a different
// database, so the pieces are applied to a third Postgres and compared.
const { readdirSync } = await import('node:fs')
const pieces = readdirSync('db/import-parts').filter((f) => f.endsWith('.sql')).sort()
const piecemeal = await freshDatabase()
let cutBadly = null
for (const piece of pieces) {
  try {
    await piecemeal.exec(readFileSync(`db/import-parts/${piece}`, 'utf8'))
  } catch (error) {
    cutBadly = `${piece}: ${error.message.split('\n')[0]}`
    break
  }
}
check(cutBadly === null, `all ${pieces.length} pieces apply in order`, cutBadly ?? '')
const viaPieces = await shapeOf(piecemeal)
check(TABLES.every((t) => viaPieces[t] === viaFile[t]), 'the pieces land the same database as the whole file',
  TABLES.filter((t) => viaPieces[t] !== viaFile[t]).map((t) => `${t}: ${viaPieces[t]} vs ${viaFile[t]}`).join(', '))
await piecemeal.close()

// --- twice is the same as once ---------------------------------------------
await pasted.exec(sql)
const again = await shapeOf(pasted)
check(JSON.stringify(again) === JSON.stringify(viaFile), 'running it a second time changes nothing',
  TABLES.filter((t) => again[t] !== viaFile[t]).join(', '))

await pasted.close()
await overConnection.close()
rmSync(scratch, { recursive: true, force: true })
console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
