// Moves what is in a browser into the database.
//
//   1. In the dashboard: Settings, Database, Export data. You get a .json file.
//   2. SUPABASE_DB_URL='postgresql://...' node scripts/import-local-data.mjs export.json
//
// Or against a throwaway Postgres for a dry run:
//
//   node scripts/import-local-data.mjs export.json --pglite
//
// Or, for somebody who would rather not touch a terminal at all, write the
// whole import out as SQL to paste into the editor:
//
//   node scripts/import-local-data.mjs export.json --sql
//
// Ids are derived from the app's own ids, so importing the same file twice
// updates the same rows instead of making a second copy of everything.
//
// Attachments are the exception: their bytes live in the browser as data URLs
// and Storage is not reachable over a database connection. Each one is written
// to db/exported-files/ and the row keeps its name, type and size with no
// path, so nothing is lost and it is obvious what still needs uploading.

import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const [, , path, ...flags] = process.argv
if (!path) {
  console.error('Usage: node scripts/import-local-data.mjs <export.json> [--pglite]')
  process.exit(1)
}
const dryRun = flags.includes('--pglite')
const toSql = flags.includes('--sql')

let raw
try {
  raw = JSON.parse(readFileSync(path, 'utf8'))
} catch (problem) {
  if (problem.code === 'ENOENT') {
    console.error(`Could not find ${path}\n`)
    console.error('Paths are read relative to the folder you are in. On Windows, ~ is not')
    console.error('a shortcut for anything, so write the whole path:\n')
    console.error('  node scripts/import-local-data.mjs "C:\\Users\\you\\Downloads\\export.json" --sql\n')
    console.error('Or copy the export next to package.json and name it on its own:\n')
    console.error('  node scripts/import-local-data.mjs export.json --sql')
    process.exit(1)
  }
  console.error(`${path} is not readable as JSON: ${problem.message}`)
  process.exit(1)
}
const state = raw.state ?? raw

/** A stable uuid for one of the app's ids, so re-importing overwrites. */
const NAMESPACE = 'eleutheria.agency/ops'
function idFor(kind, appId) {
  if (!appId) return null
  const hash = createHash('sha1').update(`${NAMESPACE}:${kind}:${appId}`).digest()
  const bytes = Buffer.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const nullIfBlank = (value) => (value === '' || value === undefined ? null : value)
const monthStart = (month) => (month ? `${month}-01` : null)

let files = 0

/** Windows will not have a colon or a slash in a filename, and nor will this. */
const safeName = (name) => String(name ?? 'file').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 80)

function attachment(value, label) {
  if (!value) return { path: null, name: null, type: null, size: null }
  if (value.dataUrl) {
    mkdirSync('db/exported-files', { recursive: true })
    const comma = value.dataUrl.indexOf(',')
    writeFileSync(`db/exported-files/${safeName(label)}-${safeName(value.name)}`,
      Buffer.from(value.dataUrl.slice(comma + 1), 'base64'))
    files += 1
  }
  return { path: null, name: value.name ?? null, type: value.type || null, size: value.size ?? null }
}

// --- connect ---------------------------------------------------------------
let query, close

/** A value written the way SQL wants it, or passed through if it is an expression. */
function literal(value) {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object' && value.raw) return value.raw
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return `'{${value.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(',')}}'`
  return `'${String(value).replace(/'/g, "''")}'`
}

const statements = []

if (toSql) {
  // Nothing is executed: the parameters are written into the statement and the
  // lot is saved for the SQL editor.
  query = (sql, params = []) => {
    const rendered = sql.replace(/\$(\d+)/g, (_, n) => literal(params[Number(n) - 1]))
    if (/^\s*(begin|commit|rollback)\s*$/i.test(rendered)) return { rows: [] }
    statements.push(rendered.trim().replace(/\s+$/, '') + ';')
    // The backouts loop asks which row it landed on; in a file, that is a
    // question the database answers when the file runs.
    if (/insert into ops\.backouts /.test(rendered)) {
      const match = rendered.match(/values \(([^,]+), ([^,]+),/)
      return { rows: [{ id: { raw: `(select id from ops.backouts where request_id = ${match[2]})` } }] }
    }
    return { rows: [] }
  }
  close = () => {}
  console.log('writing the import out as SQL\n')
} else if (dryRun) {
  // Kept on disk so the script can be run twice and the second run can be
  // seen not to duplicate anything.
  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite('db/.pglite-dryrun')
  await db.waitReady
  const fresh = (await db.query(`select to_regclass('ops.staff') as t`)).rows[0].t === null
  if (fresh) {
    await db.exec(`
      create schema if not exists auth;
      create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      end $$;
    `)
    for (const file of ['db/migrations/0001_schema.sql', 'db/migrations/0002_security.sql',
                        'db/migrations/0004_derived_billing.sql']) {
      await db.exec(readFileSync(file, 'utf8'))
    }
  }
  query = (sql, params = []) => db.query(sql, params)
  close = () => db.close()
  console.log(`dry run against an in-process Postgres in db/.pglite-dryrun${fresh ? '' : ' (existing, so this is a second pass)'}\n`)
} else {
  const url = process.env.SUPABASE_DB_URL
  if (!url) {
    console.error('Set SUPABASE_DB_URL, or pass --pglite for a dry run.')
    process.exit(1)
  }
  const Client = createRequire(import.meta.url)('pg').Client
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  query = (sql, params = []) => client.query(sql, params)
  close = () => client.end()
  console.log(`connected to ${url.replace(/:[^:@/]+@/, ':****@')}\n`)
}

const counts = {}

/**
 * Writes rows, updating rather than duplicating when one is already there.
 *
 * `conflict` names what makes a row the same row -- usually its id, but for
 * the tables the database derives it is the milestone it belongs to, because
 * the trigger will have created its own row with its own id before this runs.
 * `keep` narrows what an existing row takes from the file: for those tables,
 * only which of them were settled, since everything else follows from the
 * stage log and the database has already worked it out.
 */
async function upsert(table, rows, columns, { conflict = 'id', keep = null } = {}) {
  if (rows.length === 0) return
  for (const row of rows) {
    const values = columns.map((c) => row[c])
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const updatable = (keep ?? columns.filter((c) => c !== 'id'))
    const updates = updatable.map((c) => `${c} = excluded.${c}`).join(', ')
    await query(
      `insert into ops.${table} (${columns.join(', ')}) values (${placeholders})
       on conflict (${conflict}) do update set ${updates}`,
      values,
    )
  }
  counts[table] = (counts[table] ?? 0) + rows.length
}

await query('begin')
try {
  // --- reference and people ------------------------------------------------
  const s = state.settings ?? {}
  await query(
    `insert into ops.settings (id, company_name, company_tagline, license_number, address, currency)
     values (true, $1, $2, $3, $4, $5)
     on conflict (id) do update set company_name = excluded.company_name, company_tagline = excluded.company_tagline,
       license_number = excluded.license_number, address = excluded.address, currency = excluded.currency`,
    [s.companyName ?? 'Eleutheria', s.companyTagline ?? '', s.licenseNumber ?? '', s.address ?? '', s.currency ?? 'USD'],
  )

  await upsert('countries', (state.countries ?? []).map((c) => ({
    id: idFor('country', c.id), name_en: c.name.en, name_ar: c.name.ar,
  })), ['id', 'name_en', 'name_ar'])

  await upsert('cities', (state.cities ?? []).map((c) => ({
    id: idFor('city', c.id), country_id: idFor('country', c.countryId), name_en: c.name.en, name_ar: c.name.ar,
  })), ['id', 'country_id', 'name_en', 'name_ar'])

  await upsert('professions', (state.professions ?? []).map((p) => ({
    id: idFor('profession', p.id), name_en: p.name.en, name_ar: p.name.ar,
  })), ['id', 'name_en', 'name_ar'])

  await upsert('payment_sources', (state.paymentSources ?? []).map((p) => ({
    id: idFor('source', p.id), name: p.name, scopes: p.scopes,
  })), ['id', 'name', 'scopes'])

  // Passwords are not carried over: accounts are created in Supabase Auth and
  // linked by user_id afterwards. See docs/DATABASE.md.
  await upsert('staff', (state.staff ?? []).map((m) => ({
    id: idFor('staff', m.id), username: (m.username ?? m.name.en).toLowerCase(),
    name_en: m.name.en, name_ar: m.name.ar, phone: m.phone, email: m.email,
    role: m.role === 'user' ? 'data_entry' : m.role, status: m.status,
  })), ['id', 'username', 'name_en', 'name_ar', 'phone', 'email', 'role', 'status'])

  await upsert('agencies', (state.agencies ?? []).map((a) => ({
    id: idFor('agency', a.id), english_name: a.englishName, arabic_name: a.arabicName,
    license_number: a.licenseNumber, license_expiry: nullIfBlank(a.licenseExpiry), phone: a.phone,
    email: a.email, telephone: a.telephone, rating: a.rating,
    primary_manager_en: a.primaryManager.en, primary_manager_ar: a.primaryManager.ar,
    second_manager_en: a.secondManager.en, second_manager_ar: a.secondManager.ar, status: a.status,
  })), ['id', 'english_name', 'arabic_name', 'license_number', 'license_expiry', 'phone', 'email', 'telephone',
        'rating', 'primary_manager_en', 'primary_manager_ar', 'second_manager_en', 'second_manager_ar', 'status'])

  await upsert('agents', (state.agents ?? []).map((a) => ({
    id: idFor('agent', a.id), name_en: a.name.en, name_ar: a.name.ar, phone: a.phone, email: a.email,
    area: a.area, status: a.status, selection_fee: a.selectionFee, deployment_fee: a.deploymentFee, notes: a.notes,
  })), ['id', 'name_en', 'name_ar', 'phone', 'email', 'area', 'status', 'selection_fee', 'deployment_fee', 'notes'])

  await upsert('employers', (state.employers ?? []).map((e) => ({
    id: idFor('employer', e.id), english_name: e.englishName, arabic_name: e.arabicName, email: e.email,
    phone: e.phone, telephone: e.telephone, national_address: e.nationalAddress,
    national_id_number: e.nationalIdNumber, national_address_short_code: e.nationalAddressShortCode, status: e.status,
  })), ['id', 'english_name', 'arabic_name', 'email', 'phone', 'telephone', 'national_address',
        'national_id_number', 'national_address_short_code', 'status'])

  // --- the caseload --------------------------------------------------------
  const applicants = state.applicants ?? []
  await upsert('applicants', applicants.map((a) => ({
    id: idFor('applicant', a.id), english_name: a.englishName, arabic_name: a.arabicName, gender: a.gender,
    dob: nullIfBlank(a.dob), country: a.country, profession: a.profession, type: a.type,
    experience_years: a.experienceYears, passport_no: a.passportNo, passport_start: nullIfBlank(a.passportStart),
    passport_end: nullIfBlank(a.passportEnd), id_number: a.idNumber, phone: a.phone, telephone: a.telephone,
    status: a.status, published_to_website: a.cvLinkedToWebsite ?? false,
    agency_id: idFor('agency', a.recruitmentAgencyId), agent_id: idFor('agent', a.agentId),
  })), ['id', 'english_name', 'arabic_name', 'gender', 'dob', 'country', 'profession', 'type', 'experience_years',
        'passport_no', 'passport_start', 'passport_end', 'id_number', 'phone', 'telephone', 'status',
        'published_to_website', 'agency_id', 'agent_id'])

  await upsert('applicant_experience', applicants.flatMap((a) => a.experience.map((e) => ({
    id: idFor('experience', e.id), applicant_id: idFor('applicant', a.id), title: e.title, employer: e.employer, years: e.years,
  }))), ['id', 'applicant_id', 'title', 'employer', 'years'])

  await upsert('applicant_education', applicants.flatMap((a) => a.education.map((e) => ({
    id: idFor('education', e.id), applicant_id: idFor('applicant', a.id), degree: e.degree, institution: e.institution, year: e.year,
  }))), ['id', 'applicant_id', 'degree', 'institution', 'year'])

  // Dates are written explicitly rather than left to the column defaults:
  // importing two years of notes must not stamp every one of them with today.
  const at = (date) => (date ? `${date}T00:00:00Z` : new Date().toISOString())

  await upsert('applicant_documents', applicants.flatMap((a) => a.documents.map((d) => ({
    id: idFor('document', d.id), applicant_id: idFor('applicant', a.id), name: d.name,
    category: d.category, uploaded_at: at(d.uploadedOn),
  }))), ['id', 'applicant_id', 'name', 'category', 'uploaded_at'])

  await upsert('applicant_notes', applicants.flatMap((a) => a.notes.map((n) => ({
    id: idFor('note', n.id), applicant_id: idFor('applicant', a.id), body: n.text, created_at: at(n.date),
  }))), ['id', 'applicant_id', 'body', 'created_at'])

  const requests = state.requests ?? []
  await upsert('requests', requests.map((r) => ({
    id: idFor('request', r.id), type: r.type, contract_duration_months: r.contractDurationMonths,
    applicant_id: idFor('applicant', r.applicantId), employer_id: idFor('employer', r.employerId),
    responsible_staff_id: idFor('staff', r.responsibleEmployeeId), agency_id: idFor('agency', r.recruitmentAgencyId),
    mosaned_number: r.mosanedNumber, notes_en: r.notes.en, notes_ar: r.notes.ar,
  })), ['id', 'type', 'contract_duration_months', 'applicant_id', 'employer_id', 'responsible_staff_id',
        'agency_id', 'mosaned_number', 'notes_en', 'notes_ar'])

  await upsert('request_status_history', requests.flatMap((r) => r.statusHistory.map((h) => {
    const file = attachment(h.attachment, `stage-${h.id}`)
    return {
      id: idFor('stage', h.id), request_id: idFor('request', r.id), status: h.status, occurred_on: h.date,
      cost: h.cost, payment_source_id: idFor('source', h.paymentSourceId),
      responsible_staff_id: idFor('staff', h.responsibleEmployeeId),
      attachment_path: file.path, attachment_name: file.name, attachment_type: file.type, attachment_size: file.size,
      notes: h.notes,
    }
  })), ['id', 'request_id', 'status', 'occurred_on', 'cost', 'payment_source_id', 'responsible_staff_id',
        'attachment_path', 'attachment_name', 'attachment_type', 'attachment_size', 'notes'])

  // --- the money -----------------------------------------------------------
  const invoices = state.invoices ?? []
  await upsert('invoices', invoices.map((i) => ({
    id: idFor('invoice', i.id), invoice_number: i.invoiceNumber, request_id: idFor('request', i.recruitmentRequestId),
    employer_id: idFor('employer', i.employerId), agency_id: idFor('agency', i.recruitmentAgencyId),
    service_price: i.servicePrice, status: i.status, issued_on: i.issuedOn,
  })), ['id', 'invoice_number', 'request_id', 'employer_id', 'agency_id', 'service_price', 'status', 'issued_on'])

  await upsert('invoice_payments', invoices.flatMap((i) => i.payments.map((p) => {
    const file = attachment(p.attachment, `payment-${p.id}`)
    return {
      id: idFor('payment', p.id), invoice_id: idFor('invoice', i.id), paid_on: p.date, amount: p.amount,
      payment_source_id: idFor('source', p.sourceId),
      attachment_path: file.path, attachment_name: file.name, attachment_type: file.type, attachment_size: file.size,
    }
  })), ['id', 'invoice_id', 'paid_on', 'amount', 'payment_source_id',
        'attachment_path', 'attachment_name', 'attachment_type', 'attachment_size'])

  await upsert('payroll_entries', (state.payroll ?? []).map((e) => {
    const file = attachment(e.attachment, `payroll-${e.id}`)
    return {
      id: idFor('payroll', e.id), staff_id: idFor('staff', e.staffId), period: monthStart(e.month),
      basic_salary: e.basicSalary, overtime: e.overtime, allowances: e.allowances, status: e.status,
      attachment_path: file.path, attachment_name: file.name, attachment_type: file.type, attachment_size: file.size,
    }
  }), ['id', 'staff_id', 'period', 'basic_salary', 'overtime', 'allowances', 'status',
       'attachment_path', 'attachment_name', 'attachment_type', 'attachment_size'])

  await upsert('office_expenses', (state.officeExpenses ?? []).map((e) => {
    const file = attachment(e.attachment, `expense-${e.id}`)
    return {
      id: idFor('expense', e.id), item_en: e.item.en, item_ar: e.item.ar, category: e.category,
      amount: e.amount, spent_on: e.date, status: e.status,
      attachment_path: file.path, attachment_name: file.name, attachment_type: file.type, attachment_size: file.size,
    }
  }), ['id', 'item_en', 'item_ar', 'category', 'amount', 'spent_on', 'status',
       'attachment_path', 'attachment_name', 'attachment_type', 'attachment_size'])

  await upsert('agency_contracts', (state.agencyContracts ?? []).map((c) => ({
    id: idFor('contract', c.id), agency_id: idFor('agency', c.agencyId), reference: c.reference,
    price_per_worker: c.pricePerWorker, signed_on: nullIfBlank(c.signedOn), expires_on: nullIfBlank(c.expiresOn),
    status: c.status, notes: c.notes,
  })), ['id', 'agency_id', 'reference', 'price_per_worker', 'signed_on', 'expires_on', 'status', 'notes'])

  await upsert('agency_charges', (state.agencyCharges ?? []).map((c) => ({
    id: idFor('charge', c.id), agency_id: idFor('agency', c.agencyId), contract_id: idFor('contract', c.contractId),
    applicant_id: idFor('applicant', c.applicantId), request_id: idFor('request', c.requestId),
    milestone: c.milestone, amount: c.amount, due_on: c.dueOn, status: c.status,
    settled_on: nullIfBlank(c.settledOn), payment_source_id: idFor('source', c.paymentSourceId),
  })), ['id', 'agency_id', 'contract_id', 'applicant_id', 'request_id', 'milestone', 'amount', 'due_on',
        'status', 'settled_on', 'payment_source_id'],
    // The trigger has already derived these from the stage log; what the file
    // knows and the database does not is which halves were settled.
    { conflict: 'request_id, milestone', keep: ['status', 'settled_on', 'payment_source_id'] })

  await upsert('agent_commissions', (state.agentCommissions ?? []).map((c) => ({
    id: idFor('commission', c.id), agent_id: idFor('agent', c.agentId), applicant_id: idFor('applicant', c.applicantId),
    request_id: idFor('request', c.requestId), milestone: c.milestone, amount: c.amount, earned_on: c.earnedOn,
    status: c.status, paid_on: nullIfBlank(c.paidOn), payment_source_id: idFor('source', c.paymentSourceId),
  })), ['id', 'agent_id', 'applicant_id', 'request_id', 'milestone', 'amount', 'earned_on', 'status',
        'paid_on', 'payment_source_id'],
    { conflict: 'request_id, milestone', keep: ['status', 'paid_on', 'payment_source_id'] })

  // A backout the trigger has already opened keeps its own id, so its bills are
  // attached to that one rather than to the id the file remembers.
  const backouts = state.backouts ?? []
  for (const backout of backouts) {
    const { rows: landed } = await query(
      `insert into ops.backouts (id, request_id, applicant_id, deployed_on, returned_on, reason, liability, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (request_id) do update
         set reason = excluded.reason, notes = excluded.notes, liability = excluded.liability
       returning id`,
      [idFor('backout', backout.id), idFor('request', backout.requestId), idFor('applicant', backout.applicantId),
       nullIfBlank(backout.deployedOn), backout.returnedOn, backout.reason, backout.liability, backout.notes],
    )
    counts.backouts = (counts.backouts ?? 0) + 1

    for (const cost of backout.costs) {
      const file = attachment(cost.attachment, `backout-${cost.id}`)
      await query(
        `insert into ops.backout_costs
           (id, backout_id, label_en, label_ar, category, amount, spent_on, status, payment_source_id,
            attachment_path, attachment_name, attachment_type, attachment_size)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         on conflict (id) do update set
           backout_id = excluded.backout_id, label_en = excluded.label_en, label_ar = excluded.label_ar,
           category = excluded.category, amount = excluded.amount, spent_on = excluded.spent_on,
           status = excluded.status, payment_source_id = excluded.payment_source_id,
           attachment_name = excluded.attachment_name`,
        [idFor('backout-cost', cost.id), landed[0].id, cost.label.en, cost.label.ar, cost.category,
         cost.amount, cost.date, cost.status, idFor('source', cost.paymentSourceId),
         file.path, file.name, file.type, file.size],
      )
      counts.backout_costs = (counts.backout_costs ?? 0) + 1
    }
  }

  await upsert('notifications', (state.notifications ?? []).map((n) => ({
    id: idFor('notification', n.id) ?? randomUUID(), title: n.title, detail: n.detail,
    read_at: n.read ? at(n.date) : null, created_at: at(n.date),
  })), ['id', 'title', 'detail', 'read_at', 'created_at'])

  await query('commit')
} catch (error) {
  await query('rollback')
  console.error('\nNothing was imported.\n' + error.message)
  await close()
  process.exit(1)
}

const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
for (const [table, n] of Object.entries(counts)) console.log(`  ${String(n).padStart(4)}  ${table}`)

if (toSql) {
  const header = [
    '-- Everything this browser held, as SQL.',
    `-- Written from ${path} on ${new Date().toISOString().slice(0, 10)}.`,
    '--',
    '-- Paste into the Supabase SQL editor and run it once. Running it twice',
    '-- updates the same rows rather than making a second copy of everything.',
    '--',
    '-- Commissions, agency charges and backouts are barely in here: the',
    '-- triggers work those out from the stage log as it arrives, and what',
    '-- follows only says which of them had been settled.',
    '',
    'begin;',
    '',
  ].join('\n')
  writeFileSync('db/import.sql', `${header}${statements.join('\n')}\n\ncommit;\n`)
  console.log(`\n${total} rows written to db/import.sql (${statements.length} statements).`)
  if (files > 0) console.log(`${files} attachment(s) written to db/exported-files/.`)
  process.exit(0)
}

console.log(`\n${total} rows sent.`)

// What is actually in the database afterwards. On a second run of the same
// file these numbers must not move.
const inDatabase = []
for (const table of Object.keys(counts)) {
  const { rows } = await query(`select count(*)::int as n from ops.${table}`)
  inDatabase.push([table, rows[0].n])
}
const held = inDatabase.reduce((sum, [, n]) => sum + n, 0)
console.log(`${held} rows now in the database${held === total ? '' : `  (${inDatabase.filter(([t, n]) => n !== counts[t]).map(([t, n]) => `${t}: ${n} vs ${counts[t]} sent`).join(', ')})`}`)
if (files > 0) console.log(`${files} attachment(s) written to db/exported-files/ — upload those to Storage and set their paths.`)
await close()
