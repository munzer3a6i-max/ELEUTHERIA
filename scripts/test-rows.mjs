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
import { readFileSync, readdirSync } from 'node:fs'
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
const backToAppId = new Map()
const withUuids = (row) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (key !== 'id' && !key.endsWith('_id')) return [key, value]
    const uuid = asUuid(value)
    if (uuid !== value) backToAppId.set(uuid, value)
    return [key, uuid]
  }))

/** Undoes the id substitution, so what comes back can be compared with what went in. */
const withAppIds = (row) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) =>
    [key, typeof value === 'string' && backToAppId.has(value) ? backToAppId.get(value) : value]))

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

// Leads start empty in the app, so two are made up here: one with the whole
// record filled in and a history of every kind, one bare as the Add lead form
// leaves it.
const SAMPLE_LEADS = [
  {
    id: '1ead0000-0000-4000-8000-000000000001', refNo: 1001,
    employerName: 'Al Noor Medical Group', contactName: 'Dr. Faisal Al Harbi', contactRole: 'HR Director',
    phone: '+966 55 482 1930', email: 'f.alharbi@alnoormed.example', industry: 'Healthcare',
    city: 'Riyadh', country: 'Saudi Arabia', need: '24 ICU & ER nurses',
    enquiry: 'We are looking to recruit experienced ICU and ER nurses.', experience: '3+ years',
    targetStart: 'Jan 2027', requirements: 'SCFHS eligibility.', source: 'WhatsApp', stage: 'Qualified',
    stageChangedAt: '2026-10-27T12:10:00.000Z', contacted: true, ownerId: '', receivedOn: '2026-10-26',
    lastContactAt: '2026-10-28T13:40:00.000Z', lastContactChannel: 'WhatsApp',
    nextFollowUpAt: '2026-10-28T14:00:00.000Z', nextStep: 'Send shortlist & fee proposal',
    nextStepDetail: 'Confirm the ICU / ER split first.', notes: '',
    document: { path: 'x/1.pdf', name: 'Nursing requirements.pdf', size: 247808, addedAt: '2026-10-27T09:00:00.000Z' },
    createdAt: '2026-10-26T06:12:00.000Z',
    activities: [
      { id: '1ead0000-0000-4000-8000-0000000000a1', kind: 'contact', channel: 'WhatsApp', direction: 'Outbound',
        title: 'Requirements confirmed', body: 'Shortlist by 30 October.', durationMinutes: 0, authorId: '', at: '2026-10-28T13:40:00.000Z' },
      { id: '1ead0000-0000-4000-8000-0000000000a2', kind: 'stage', channel: '', direction: '',
        title: 'Moved to Qualified', body: '', durationMinutes: 0, authorId: '', at: '2026-10-27T12:10:00.000Z' },
      { id: '1ead0000-0000-4000-8000-0000000000a3', kind: 'contact', channel: 'Call', direction: 'Outbound',
        title: 'Discovery call completed', body: '', durationMinutes: 18, authorId: '', at: '2026-10-27T11:30:00.000Z' },
      { id: '1ead0000-0000-4000-8000-0000000000a4', kind: 'note', channel: '', direction: '',
        title: 'Note', body: 'Prefers WhatsApp after 14:00 AST.', durationMinutes: 0, authorId: '', at: '2026-10-26T13:45:00.000Z' },
    ],
  },
  {
    id: '1ead0000-0000-4000-8000-000000000002', refNo: 1002,
    employerName: 'Najd Facilities', contactName: 'Ahmed Al Dosari', contactRole: '', phone: '', email: 'a@najd.example',
    industry: '', city: '', country: '', need: '', enquiry: '30 cleaners for Riyadh.', experience: '', targetStart: '',
    requirements: '', source: 'Manual entry', stage: 'New enquiry', stageChangedAt: '2026-10-29T05:00:00.000Z',
    contacted: false, ownerId: '', receivedOn: '2026-10-29', lastContactAt: '', lastContactChannel: '',
    nextFollowUpAt: '', nextStep: '', nextStepDetail: '', notes: '', document: null,
    createdAt: '2026-10-29T05:00:00.000Z', activities: [],
  },
]

const mapped = await page.evaluate(async (sampleLeads) => {
  const rows = await import('/src/data/rows.ts')
  const { useAppStore } = await import('/src/store/useAppStore.ts')
  const s = useAppStore.getState()

  // Everything the app holds, in the order the foreign keys require.
  const out = []
  const push = (mapper, items, parentId) =>
    out.push({ table: mapper.table, rows: items.map((item) => mapper.out(item, parentId)) })

  out.push({ table: 'settings', rows: [rows.settingsRows.out(s.settings)] })
  push(rows.countryRows, s.countries)
  push(rows.cityRows, s.cities)
  push(rows.professionRows, s.professions)
  push(rows.paymentSourceRows, s.paymentSources)
  push(rows.staffRows, s.staff)
  push(rows.leadRows, sampleLeads)
  for (const lead of sampleLeads) push(rows.leadActivityRows, lead.activities, lead.id)
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
  // The company's own details, which the Settings screen edits.
  const company = rows.settingsRows.in(rows.settingsRows.out(s.settings))
  for (const key of Object.keys(company)) {
    if (JSON.stringify(company[key]) !== JSON.stringify(s.settings[key])) {
      trips.push(`settings.${key}: ${s.settings[key]} -> ${company[key]}`)
    }
  }
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
  trip('lead', rows.leadRows, sampleLeads, ['activities'])
  for (const lead of sampleLeads) trip('leadActivity', rows.leadActivityRows, lead.activities)

  return { out, trips }
}, SAMPLE_LEADS)
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
// Every migration that shapes a table, in order. The storage ones (0003, 0005,
// 0006) belong to Supabase and are applied only against the real project, and
// the derived-billing triggers (0004) are left out on purpose: this script
// inserts the commissions and charges itself, which is the thing being checked,
// and the triggers would write their own copies of them first.
for (const file of readdirSync('db/migrations')
  .filter((name) => name.endsWith('.sql') && !/^(0003|0004|0005|0006|0021)/.test(name))
  .sort()) {
  await db.exec(readFileSync(`db/migrations/${file}`, 'utf8'))
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

// --- and the whole way back -------------------------------------------------
// Everything the app holds, written to Postgres, read out of Postgres, and
// folded back into the app's own shapes. What comes out should be what went
// in, apart from the things the database deliberately does not keep.
const readBack = {}
for (const table of new Set(mapped.out.map((entry) => entry.table))) {
  const { rows: got } = await db.query(`select * from ops.${table}`)
  readBack[table] = got.map(withAppIds)
}

const browser2 = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page2 = await browser2.newPage()
await page2.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
const differences = await page2.evaluate(async ({ tables, sampleLeads }) => {
  const { assemble } = await import('/src/data/assemble.ts')
  const { useAppStore } = await import('/src/store/useAppStore.ts')
  const state = useAppStore.getState()
  const back = assemble(tables)

  // A file's bytes live in Storage, not in a row, and the database stamps its
  // own timestamps. Neither is expected to survive the trip.
  // Keys are sorted as well as filtered: two records can hold the same thing
  // and still stringify differently, and that is not a difference worth
  // failing over.
  // Rows in a table have no order of their own, so a list of records is
  // compared as a set. Where order carries meaning -- the stage log is a
  // sequence, not a bag -- it is checked on its own, below.
  const normalise = (value) => {
    if (Array.isArray(value)) {
      const items = value.map(normalise)
      return items.every((item) => item && typeof item === 'object' && 'id' in item)
        ? items.sort((a, b) => String(a.id).localeCompare(String(b.id)))
        : items
    }
    if (value && typeof value === 'object') {
      const copy = {}
      for (const [key, inner] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
        if (['dataUrl', 'uploadedOn', 'createdOn', 'updatedOn', 'updatedBy', 'credentials',
             'photoDataUrl', 'profileImageDataUrl', 'author', 'path'].includes(key)) continue
        copy[key] = normalise(inner)
      }
      return copy
    }
    return value
  }

  const problems = []
  const compare = (name, before, after) => {
    const sortById = (list) => [...list].sort((a, b) => String(a.id).localeCompare(String(b.id)))
    const a = JSON.stringify(normalise(sortById(before)))
    const b = JSON.stringify(normalise(sortById(after)))
    if (a !== b) {
      const at = [...a].findIndex((ch, i) => ch !== b[i])
      problems.push(`${name}: differs near "${a.slice(Math.max(0, at - 40), at + 40)}" vs "${b.slice(Math.max(0, at - 40), at + 40)}"`)
    }
  }

  compare('countries', state.countries, back.countries)
  compare('cities', state.cities, back.cities)
  compare('professions', state.professions, back.professions)
  compare('paymentSources', state.paymentSources, back.paymentSources)
  compare('staff', state.staff, back.staff)
  compare('agencies', state.agencies, back.agencies)
  compare('agents', state.agents, back.agents)
  compare('employers', state.employers, back.employers)
  compare('applicants', state.applicants, back.applicants)
  compare('requests', state.requests, back.requests)
  compare('invoices', state.invoices, back.invoices)
  compare('payroll', state.payroll, back.payroll)
  compare('officeExpenses', state.officeExpenses, back.officeExpenses)
  compare('agencyContracts', state.agencyContracts, back.agencyContracts)
  compare('agencyCharges', state.agencyCharges, back.agencyCharges)
  compare('agentCommissions', state.agentCommissions, back.agentCommissions)
  compare('backouts', state.backouts, back.backouts)
  compare('leads', sampleLeads, back.leads)

  // A lead's history reads newest first.
  const unsorted = back.leads.filter((lead) => lead.activities.some((a, i, all) => i > 0 && all[i - 1].at < a.at))
  if (unsorted.length > 0) problems.push(`lead history out of order for ${unsorted.length} lead(s)`)

  // The one ordering the app depends on: a worker's stages, oldest first.
  const outOfOrder = back.requests.filter((request) =>
    request.statusHistory.some((entry, i, all) => i > 0 && all[i - 1].date > entry.date))
  if (outOfOrder.length > 0) problems.push(`stage log out of order for ${outOfOrder.length} request(s)`)

  const stages = back.requests.reduce((sum, r) => sum + r.statusHistory.length, 0)
  return {
    problems,
    stages,
    counts: Object.fromEntries(
      Object.entries(back).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]),
    ),
  }
}, { tables: readBack, sampleLeads: SAMPLE_LEADS })
await browser2.close()

console.log()
check(differences.problems.length === 0,
  'the whole dataset survives the trip through Postgres and back',
  differences.problems.slice(0, 3).join('  |  '))
console.log('  read back:', Object.entries(differences.counts).map(([k, n]) => `${k} ${n}`).join(', '))
console.log(`  ${differences.stages} stage entries, each request's in date order`)

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}`)
await db.close()
process.exit(failures === 0 ? 0 : 1)
