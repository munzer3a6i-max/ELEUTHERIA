// Runs the migrations against a real Postgres, in process, and then tries to
// break them: every role attempts every kind of access, and the script reports
// what the database actually allowed against what the rules say it should.
//
//   npm i -D @electric-sql/pglite --no-save && node scripts/test-schema.mjs
//
// Storage policies are not covered here: storage.objects belongs to Supabase,
// not to Postgres, so 0003 is applied only against the real project.

import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const db = new PGlite()
await db.waitReady
console.log('running against', (await db.query('select version()')).rows[0].version.split(',')[0], '\n')

let failures = 0
function check(passed, label, detail = '') {
  console.log(`${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!passed) failures += 1
}

// --- the little of Supabase that the migrations lean on --------------------
await db.exec(`
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  end $$;
`)

for (const file of ['db/migrations/0001_schema.sql', 'db/migrations/0002_security.sql', 'db/migrations/0004_derived_billing.sql', 'db/migrations/0007_public_projection.sql']) {
  try {
    await db.exec(readFileSync(file, 'utf8'))
    console.log(`applied  ${file}`)
  } catch (error) {
    console.log(`FAILED   ${file}\n   ${String(error.message).split('\n').slice(0, 4).join('\n   ')}`)
    process.exit(1)
  }
}
// A script people paste into a web editor by hand gets pasted twice, or half
// of it does. Running the whole thing again has to be a no-op.
const shape = async () => JSON.stringify((await db.query(`
  select
    (select count(*) from pg_tables where schemaname = 'ops') as tables,
    (select count(*) from pg_policies where schemaname = 'ops') as policies,
    (select count(*) from pg_indexes where schemaname = 'ops') as indexes,
    (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'ops' and not t.tgisinternal) as triggers
`)).rows[0])

const before = await shape()
let rerunError = null
try {
  for (const file of ['db/migrations/0001_schema.sql', 'db/migrations/0002_security.sql', 'db/migrations/0004_derived_billing.sql', 'db/migrations/0007_public_projection.sql']) {
    await db.exec(readFileSync(file, 'utf8'))
  }
} catch (error) {
  rerunError = error.message.split('\n')[0]
}
check(rerunError === null, 'the migrations can be run a second time', rerunError ?? '')
check(before === (await shape()), 'running them twice changes nothing', await shape())
console.log()

const one = async (sql) => (await db.query(sql)).rows[0]
console.log('tables in ops  ', (await one(`select count(*)::int n from pg_tables where schemaname = 'ops'`)).n)
console.log('policies       ', (await one(`select count(*)::int n from pg_policies where schemaname = 'ops'`)).n)
console.log(
  'rls forced     ',
  (await one(`select count(*)::int n from pg_class c join pg_namespace s on s.oid = c.relnamespace
              where s.nspname = 'ops' and c.relkind = 'r' and c.relrowsecurity and c.relforcerowsecurity`)).n,
)
console.log()

// Nothing of the dashboard's may end up in the website's own schema.
const strays = (await db.query(
  `select table_name from information_schema.tables where table_schema = 'public'`,
)).rows.map((r) => r.table_name)
check(strays.length === 1 && strays[0] === 'published_workers', 'public schema gains only the published view', `[${strays}]`)

// --- three people, one of each role ----------------------------------------
const ids = {
  admin: '11111111-1111-1111-1111-111111111111',
  accountant: '22222222-2222-2222-2222-222222222222',
  data_entry: '33333333-3333-3333-3333-333333333333',
  stranger: '44444444-4444-4444-4444-444444444444',
}
await db.exec(`
  insert into ops.staff (user_id, username, name_en, role) values
    ('${ids.admin}', 'kylie', 'Kylie', 'admin'),
    ('${ids.accountant}', 'tess', 'Tess', 'accountant'),
    ('${ids.data_entry}', 'roz', 'Roz', 'data_entry');
  insert into ops.employers (id, english_name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Al-Mutairi');
  insert into ops.applicants (id, english_name, gender, dob, status, published_to_website)
    values ('bbbbbbbb-0000-0000-0000-000000000001', 'Maricel S. Dela Cruz', 'Female', '1994-03-02', 'Available', true);
  insert into ops.applicants (id, english_name, gender, dob, status, published_to_website)
    values ('bbbbbbbb-0000-0000-0000-000000000002', 'Not Published', 'Female', '1990-01-01', 'Available', false);
  insert into ops.applicants (id, english_name, gender, dob, status, published_to_website)
    values ('bbbbbbbb-0000-0000-0000-000000000003', 'Already Placed', 'Female', '1991-01-01', 'Deployed', true);
  insert into ops.office_expenses (item_en, amount, spent_on) values ('Office Rent', 320, '2026-09-01');
  insert into ops.payroll_entries (staff_id, period, basic_salary)
    select id, '2026-09-01', 700 from ops.staff where username = 'kylie';
`)

/**
 * Runs one statement as one role and says whether it actually did anything.
 *
 * This matters more than it looks. An insert a policy forbids raises an error,
 * but an update or a delete a policy forbids simply matches no rows and
 * reports success -- which is also how the Supabase client behaves, and why
 * the application has to check the affected count rather than the absence of
 * an error.
 */
async function as(who, sql) {
  await db.exec('begin')
  try {
    await db.exec(`set local role authenticated; set local test.uid = '${ids[who]}';`)
    const result = await db.query(sql)
    await db.exec('rollback')
    const touched = result.affectedRows ?? result.rows.length
    return { allowed: touched > 0, rows: result.rows, touched }
  } catch (error) {
    await db.exec('rollback')
    return { allowed: false, error: error.message }
  }
}

/** A select that returns no rows is refused just as firmly as one that errors. */
async function canRead(who, sql) {
  const outcome = await as(who, sql)
  return outcome.rows !== undefined && outcome.rows.length > 0
}

console.log('\nwhat each role may do\n')
const reads = [
  ['operations', `select 1 from ops.applicants limit 1`, { admin: true, accountant: true, data_entry: true }],
  ['reference', `select 1 from ops.staff limit 1`, { admin: true, accountant: true, data_entry: true }],
  ['finance', `select 1 from ops.office_expenses limit 1`, { admin: true, accountant: true, data_entry: false }],
  ['payroll', `select 1 from ops.payroll_entries limit 1`, { admin: true, accountant: false, data_entry: false }],
]
for (const [label, sql, expected] of reads) {
  for (const [who, allowed] of Object.entries(expected)) {
    check((await canRead(who, sql)) === allowed, `${who.padEnd(10)} ${allowed ? 'reads   ' : 'refused '} ${label}`)
  }
}

console.log()
const writes = [
  ['operations', `insert into ops.employers (english_name) values ('New One')`, { admin: true, accountant: false, data_entry: true }],
  ['finance', `insert into ops.office_expenses (item_en, amount, spent_on) values ('Courier', 25, '2026-09-20')`, { admin: true, accountant: true, data_entry: false }],
  ['system', `insert into ops.professions (name_en) values ('Gardener')`, { admin: true, accountant: false, data_entry: false }],
  ['deleting a worker', `delete from ops.applicants where english_name = 'Not Published'`, { admin: true, accountant: false, data_entry: true }],
]
for (const [label, sql, expected] of writes) {
  for (const [who, allowed] of Object.entries(expected)) {
    const outcome = await as(who, sql)
    check(outcome.allowed === allowed, `${who.padEnd(10)} ${allowed ? 'writes  ' : 'refused '} ${label}`)
  }
}

console.log()
// Somebody with an auth account but no staff row is not staff.
check(!(await canRead('stranger', 'select 1 from ops.applicants limit 1')), 'a signed-in stranger reads nothing')
await db.exec(`update ops.staff set status = 'Inactive' where username = 'roz'`)
check(!(await canRead('data_entry', 'select 1 from ops.applicants limit 1')), 'a suspended account reads nothing')
await db.exec(`update ops.staff set status = 'Active' where username = 'roz'`)

// The one edit that would undo everything above.
const selfPromote = await as('data_entry', `update ops.staff set role = 'admin' where username = 'roz'`)
check(!selfPromote.allowed, 'data entry cannot promote itself')
const adminSelfEdit = await as('admin', `update ops.staff set role = 'data_entry' where username = 'kylie'`)
check(!adminSelfEdit.allowed, 'even an administrator cannot edit their own role', adminSelfEdit.error ? '' : '(allowed!)')
const adminEditsOther = await as('admin', `update ops.staff set role = 'accountant' where username = 'roz'`)
check(adminEditsOther.allowed, 'an administrator can change somebody else')

console.log('\nthe public view\n')
const columns = (await db.query(
  `select column_name from information_schema.columns where table_name = 'published_workers' order by ordinal_position`,
)).rows.map((r) => r.column_name)
console.log('  exposes:', columns.join(', '))
// cv_path is published on purpose: the office puts a worker's CV on the site
// for visitors to read, and 0006 gives it a public bucket of its own. The file
// name the office uploaded is not published, and nothing below ever is.
const sensitive = ['passport_no', 'id_number', 'phone', 'telephone', 'dob', 'passport_start', 'passport_end', 'cv_file_name', 'passport_copy_path', 'agent_id', 'agency_id']
check(sensitive.every((c) => !columns.includes(c)), 'no identifying or commercial column is published')
check(columns.includes('photo_path') && columns.includes('cv_path'), 'the photograph and the CV are, so the site has something to show')

await db.exec(`begin; set local role anon;`)
const published = (await db.query('select english_name, age from public.published_workers')).rows
await db.exec('rollback')
check(published.length === 1 && published[0].english_name === 'Maricel S. Dela Cruz', 'anon sees only published, available workers', `[${published.map((r) => r.english_name)}]`)
const expectedAge = Math.floor((Date.now() - Date.parse('1994-03-02')) / 31_557_600_000)
check(published[0]?.age === expectedAge, 'the date of birth is reduced to an age', `age ${published[0]?.age}`)

// The arrangement that keeps a well-meant fix in the Supabase dashboard from
// taking the website down: the view borrows nobody's rights, so the linter has
// nothing to report, and anon holds no privilege on the table behind it.
const invoker = (await db.query(
  `select coalesce((select option_value from pg_options_to_table(c.reloptions)
      where option_name = 'security_invoker'), 'false') as value
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'published_workers'`,
)).rows[0]?.value
check(invoker === 'true', 'the view runs as its caller, so there is nothing for a linter to fix', `security_invoker=${invoker}`)

const anonOnApplicants = (await db.query(
  `select count(*)::int n from information_schema.role_table_grants
    where table_schema = 'ops' and table_name = 'applicants' and grantee = 'anon'`,
)).rows[0].n
check(anonOnApplicants === 0, 'anon is granted nothing at all on ops.applicants', `${anonOnApplicants} grant(s)`)

const anonColumns = (await db.query(
  `select count(*)::int n from information_schema.column_privileges
    where table_schema = 'ops' and grantee = 'anon'`,
)).rows[0].n
check(anonColumns === 0, 'nor on any column of any ops table', `${anonColumns} grant(s)`)

for (const [label, sql] of [
  ['the applicants table', 'select * from ops.applicants'],
  ['the money', 'select * from ops.office_expenses'],
  ['the staff list', 'select * from ops.staff'],
]) {
  await db.exec('begin')
  let refused = false
  try {
    await db.exec(`set local role anon;`)
    await db.query(sql)
  } catch {
    refused = true
  }
  await db.exec('rollback')
  check(refused, `anon is refused ${label}`)
}

// --- the pieces people actually paste ---------------------------------------
// db/parts/*.sql is the same SQL cut into files small enough to survive a copy
// and paste. Cut in the wrong place it would still look fine and build a
// different database, so the pieces are applied to a second Postgres and the
// two are compared.
console.log('\nthe split files\n')
const { readdirSync } = await import('node:fs')
let parts = []
try {
  parts = readdirSync('db/parts').filter((f) => f.endsWith('.sql')).sort()
} catch {
  // Not generated yet; scripts/apply-migrations.mjs writes them.
}

if (parts.length === 0) {
  console.log('  (none yet — run node scripts/apply-migrations.mjs)')
} else {
  const piecemeal = new PGlite()
  await piecemeal.waitReady
  await piecemeal.exec(`
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid
      language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    end $$;
  `)

  let broke = null
  for (const file of parts) {
    const body = readFileSync(`db/parts/${file}`, 'utf8')
    // The storage part belongs to Supabase, not to Postgres.
    if (/storage\.objects|storage\.buckets/.test(body)) continue
    try {
      await piecemeal.exec(body)
    } catch (error) {
      broke = `${file}: ${error.message.split('\n')[0]}`
      break
    }
  }
  check(broke === null, `all ${parts.length} parts apply in order`, broke ?? '')

  const describe = async (client) => (await client.query(`
    select
      (select count(*) from pg_tables where schemaname = 'ops') tables,
      (select count(*) from pg_policies where schemaname = 'ops') policies,
      (select count(*) from pg_indexes where schemaname = 'ops') indexes,
      (select string_agg(table_name || '.' || column_name, ',' order by table_name, column_name)
         from information_schema.columns where table_schema = 'ops') columns
  `)).rows[0]
  const whole = await describe(db)
  const pieces = await describe(piecemeal)
  check(whole.tables === pieces.tables && whole.policies === pieces.policies && whole.indexes === pieces.indexes,
    'the parts build the same tables, policies and indexes as the whole file',
    `${pieces.tables}/${pieces.policies}/${pieces.indexes} vs ${whole.tables}/${whole.policies}/${whole.indexes}`)
  check(whole.columns === pieces.columns, 'every column matches, so no statement was cut in half')
  await piecemeal.close()
}

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}`)
await db.close()
process.exit(failures === 0 ? 0 : 1)
