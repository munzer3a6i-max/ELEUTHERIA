// Checks src/data/rows.ts against the real migrations.
//
//   npm run dev          (in another terminal)
//   node scripts/test-rows.mjs
//
// The mappers are loaded from the running app, so this is the app's own code
// mapping the app's own data. Every row it produces is then inserted into a
// Postgres built from db/migrations. A column that does not exist, a required
// one left out, a date sent as '' instead of null, a number sent as text --
// all of it fails here, against the same schema the project is running.
//
// Then each record is mapped back and compared with what it started as, so a
// mapping that is right in one direction and lossy in the other is caught too.

import { PGlite } from '@electric-sql/pglite'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

/*
  The demo data still carries readable ids -- 'ap-1', 'rr-2' -- because a seed
  file nobody can read is a seed file nobody maintains. Real records have uuids:
  the app generates them, and scripts/import-local-data.mjs derives them when it
  carries a browser export across. So every id is put through the same kind of
  derivation here, and what this file actually tests is the columns and their
  types, not the shape of the demo's ids.
*/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function asUuid(value) {
  if (typeof value !== 'string' || value === '' || UUID.test(value)) return value
  const bytes = Buffer.from(createHash('sha1').update(`test:${value}`).digest().subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
const withUuids = (row) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) =>
    [key, key === 'id' || key.endsWith('_id') ? asUuid(value) : value]))

const BASE = process.env.APP_URL ?? 'http://localhost:5180'

let failures = 0
const check = (passed, label, detail = '') => {
  console.log(`${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!passed) failures += 1
}

// --- ask the running app to map its whole dataset --------------------------
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })

const mapped = await page.evaluate(async () => {
  const rows = await import('/src/data/rows.ts')
  const { useAppStore } = await import('/src/store/useAppStore.ts')
  const s = useAppStore.getState()

  // Everything the app holds, in the order the foreign keys require.
  const out = []
  const push = (mapper, items, parentId) =>
    out.push({ table: mapper.table, rows: items.map((item) => mapper.out(item, parentId)) })

  push(rows.countryRows, s.countries)
  push(rows.cityRows, s.cities)
  push(rows.professionRows, s.professions)
  push(rows.paymentSourceRows, s.paymentSources)
  push(rows.staffRows, s.staff)
  push(rows.agencyRows, s.agencies)
  push(rows.agentRows, s.agents)
  push(rows.employerRows, s.employers)
  push(rows.applicantRows, s.applicants)
  for (const a of s.applicants) {
    push(rows.experienceRows, a.experience, a.id)
    push(rows.educationRows, a.education, a.id)
    push(rows.documentRows, a.documents, a.id)
    push(rows.noteRows, a.notes, a.id)
  }
  push(rows.requestRows, s.requests)
  for (const r of s.requests) push(rows.statusHistoryRows, r.statusHistory, r.id)
  push(rows.invoiceRows, s.invoices)
  for (const i of s.invoices) push(rows.paymentRows, i.payments, i.id)
  push(rows.payrollRows, s.payroll)
  push(rows.officeExpenseRows, s.officeExpenses)
  push(rows.contractRows, s.agencyContracts)
  push(rows.chargeRows, s.agencyCharges)
  push(rows.commissionRows, s.agentCommissions)
  push(rows.backoutRows, s.backouts)
  for (const b of s.backouts) push(rows.backoutCostRows, b.costs, b.id)
  push(rows.notificationRows, s.notifications)

  // And the round trip, for the collections held whole.
  const trips = []
  const trip = (name, mapper, items, drop = []) => {
    for (const item of items) {
      const back = mapper.in(mapper.out(item, 'x'))
      for (const key of Object.keys(item)) {
        if (drop.includes(key)) continue
        const before = JSON.stringify(item[key])
        const after = JSON.stringify(back[key])
        if (before !== after) trips.push(`${name}.${key}: ${before} -> ${after}`)
      }
    }
  }
  // Dropped fields are the ones the database deliberately does not hold:
  // timestamps it sets itself, files that live in Storage, passwords that live
  // in auth.users, and children kept in their own tables.
  trip('country', rows.countryRows, s.countries)
  trip('city', rows.cityRows, s.cities)
  trip('profession', rows.professionRows, s.professions)
  trip('paymentSource', rows.paymentSourceRows, s.paymentSources)
  trip('staff', rows.staffRows, s.staff, ['credentials'])
  trip('agency', rows.agencyRows, s.agencies, ['createdOn'])
  trip('agent', rows.agentRows, s.agents, ['createdOn'])
  trip('employer', rows.employerRows, s.employers, ['createdOn', 'profileImageDataUrl'])
  trip('applicant', rows.applicantRows, s.applicants,
    ['createdOn', 'updatedOn', 'updatedBy', 'photoDataUrl', 'cvFileName', 'passportCopyFileName',
     'experience', 'education', 'documents', 'notes'])
  trip('request', rows.requestRows, s.requests, ['createdOn', 'updatedOn', 'statusHistory'])
  trip('invoice', rows.invoiceRows, s.invoices, ['payments'])
  trip('payroll', rows.payrollRows, s.payroll, ['attachment'])
  trip('officeExpense', rows.officeExpenseRows, s.officeExpenses, ['attachment'])
  trip('contract', rows.contractRows, s.agencyContracts)
  trip('charge', rows.chargeRows, s.agencyCharges)
  trip('commission', rows.commissionRows, s.agentCommissions)
  trip('backout', rows.backoutRows, s.backouts, ['costs', 'createdOn'])
  trip('notification', rows.notificationRows, s.notifications, ['date'])

  return { out, trips }
})
await browser.close()

// --- put every row into a database built from the migrations ---------------
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
for (const file of ['db/migrations/0001_schema.sql', 'db/migrations/0002_security.sql']) {
  await db.exec(readFileSync(file, 'utf8'))
}

let inserted = 0
for (const { table, rows } of mapped.out) {
  for (const original of rows) {
    const row = withUuids(original)
    const columns = Object.keys(row)
    const values = columns.map((c) => row[c])
    try {
      await db.query(
        `insert into ops.${table} (${columns.join(', ')}) values (${columns.map((_, i) => `$${i + 1}`).join(', ')})`,
        values,
      )
      inserted += 1
    } catch (error) {
      check(false, `insert into ops.${table}`, error.message.split('\n')[0])
    }
  }
}
check(true, `${inserted} rows written through the mappers into the real schema`)

// Nothing required may have been quietly skipped.
const { rows: required } = await db.query(`
  select table_name, column_name
    from information_schema.columns
   where table_schema = 'ops' and is_nullable = 'NO' and column_default is null
`)
// A table can appear several times -- one entry per parent -- so the columns
// seen for it are merged rather than overwritten, and a table that never had
// any rows is not evidence of anything.
const sent = new Map()
for (const { table, rows } of mapped.out) {
  const columns = sent.get(table) ?? new Set()
  for (const row of rows) for (const column of Object.keys(row)) columns.add(column)
  if (columns.size > 0) sent.set(table, columns)
}
const unsupplied = required
  .filter(({ table_name, column_name }) => sent.has(table_name) && !sent.get(table_name).has(column_name))
  .map(({ table_name, column_name }) => `${table_name}.${column_name}`)
check(unsupplied.length === 0, 'every required column is supplied by a mapper', unsupplied.join(', '))

console.log()
check(mapped.trips.length === 0, 'every record survives the round trip unchanged',
  mapped.trips.slice(0, 6).join(' | '))

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}`)
await db.close()
process.exit(failures === 0 ? 0 : 1)
