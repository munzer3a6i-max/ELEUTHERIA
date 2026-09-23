// The money rules, checked where they now live.
//
//   node scripts/test-billing.mjs
//
// The same behaviour src/lib/derivedBilling.ts was written to: a stage creates
// money, a settled row is a fact, and a row is never invented for a stage that
// has not happened. It runs against a real Postgres built from db/migrations.

import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

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
for (const file of ['0001_schema', '0002_security', '0004_derived_billing']) {
  await db.exec(readFileSync(`db/migrations/${file}.sql`, 'utf8'))
}

let failures = 0
const check = (passed, label, detail = '') => {
  console.log(`${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!passed) failures += 1
}
const q = async (sql, params = []) => (await db.query(sql, params)).rows

// --- a worker, an agent, an office with a contract, and a request ----------
const [{ id: agency }] = await q(`insert into ops.agencies (english_name) values ('Pacific Crew') returning id`)
const [{ id: contract }] = await q(
  `insert into ops.agency_contracts (agency_id, reference, price_per_worker, status)
   values ($1, 'PCM-01', 2200, 'Active') returning id`, [agency])
const [{ id: agent }] = await q(
  `insert into ops.agents (name_en, selection_fee, deployment_fee) values ('Nelson', 500, 500) returning id`)
const [{ id: worker }] = await q(
  `insert into ops.applicants (english_name, gender, agent_id, agency_id) values ('Rosalinda', 'Female', $1, $2) returning id`,
  [agent, agency])
const [{ id: employer }] = await q(`insert into ops.employers (english_name) values ('Al-Mutairi') returning id`)
const [{ id: request }] = await q(
  `insert into ops.requests (type, applicant_id, employer_id, agency_id) values ('Domestic', $1, $2, $3) returning id`,
  [worker, employer, agency])

const stage = (status, on) =>
  q(`insert into ops.request_status_history (request_id, status, occurred_on) values ($1, $2, $3) returning id`,
    [request, status, on])

const commissions = () => q(`select milestone, amount::float, earned_on::text, status from ops.agent_commissions where request_id = $1 order by milestone`, [request])
const charges = () => q(`select milestone, amount::float, due_on::text, status from ops.agency_charges where request_id = $1 order by milestone`, [request])
const backouts = () => q(`select deployed_on::text, returned_on::text, liability from ops.backouts where request_id = $1`, [request])

// --- nothing has happened yet ----------------------------------------------
check((await commissions()).length === 0 && (await charges()).length === 0,
  'no milestone, no money')

// --- selected ---------------------------------------------------------------
const [{ id: selectedStage }] = await stage('Selected', '2026-04-10')
check(JSON.stringify(await commissions()) === JSON.stringify([
  { milestone: 'Selected', amount: 500, earned_on: '2026-04-10', status: 'Pending' }]),
  'selecting her earns the agent the first half', JSON.stringify(await commissions()))
check(JSON.stringify(await charges()) === JSON.stringify([
  { milestone: 'Selected', amount: 1100, due_on: '2026-04-10', status: 'Pending' }]),
  'and bills the office half its contract price', JSON.stringify(await charges()))

// --- the visa ---------------------------------------------------------------
await stage('Visa Stamping', '2026-04-28')
check((await charges()).length === 2 && (await charges())[1].amount === 1100,
  'the visa brings the second half', JSON.stringify(await charges()))

// --- money that has moved is a fact -----------------------------------------
await q(`update ops.agent_commissions set status = 'Paid', paid_on = '2026-04-12' where request_id = $1 and milestone = 'Selected'`, [request])
await q(`update ops.agents set selection_fee = 650, deployment_fee = 650 where id = $1`, [agent])
check((await commissions()).find((c) => c.milestone === 'Selected').amount === 500,
  'raising the fee does not rewrite a commission already paid')

await q(`update ops.agency_contracts set price_per_worker = 2600 where id = $1`, [contract])
check((await charges()).every((c) => c.amount === 1300),
  'but unsettled halves follow the new contract price', JSON.stringify(await charges()))

// --- deployed ---------------------------------------------------------------
await stage('Deployed', '2026-05-05')
check((await commissions()).find((c) => c.milestone === 'Deployed')?.amount === 650,
  'deployment earns the second half, at the fee in force now')

// --- unlogging a stage ------------------------------------------------------
await q(`delete from ops.request_status_history where id = $1`, [selectedStage])
const afterDelete = await commissions()
check(afterDelete.some((c) => c.milestone === 'Selected' && c.status === 'Paid'),
  'removing the stage leaves the commission that was paid')
const chargesAfter = await charges()
check(!chargesAfter.some((c) => c.milestone === 'Selected'),
  'and takes away the unsettled charge that no longer has a stage behind it',
  JSON.stringify(chargesAfter))
await stage('Selected', '2026-04-10')

// --- a worker who pulls out -------------------------------------------------
const [{ id: backoutStage }] = await stage('Back Out', '2026-06-20')
check(JSON.stringify(await backouts()) === JSON.stringify([
  { deployed_on: '2026-05-05', returned_on: '2026-06-20', liability: 'Company' }]),
  'six weeks in is inside the guarantee, so the company carries it', JSON.stringify(await backouts()))

await q(`update ops.request_status_history set occurred_on = '2026-09-20' where id = $1`, [backoutStage])
check((await backouts())[0].liability === 'Employer',
  'four months in is past it, so the employer does', JSON.stringify(await backouts()))

await q(`update ops.backouts set liability = 'Agency' where request_id = $1`, [request])
await q(`update ops.request_status_history set occurred_on = '2026-06-20' where id = $1`, [backoutStage])
check((await backouts())[0].liability === 'Agency',
  'an office that decided the agency carries it has decided')

// --- a bill is a record, not a toggle ---------------------------------------
const [{ id: backout }] = await q(`select id from ops.backouts where request_id = $1`, [request])
await q(`insert into ops.backout_costs (backout_id, label_en, amount, spent_on) values ($1, 'Return ticket', 420, '2026-06-21')`, [backout])
await q(`delete from ops.request_status_history where id = $1`, [backoutStage])
check((await backouts()).length === 1, 'a backout with bills against it is not removed by unlogging the stage')

await q(`delete from ops.backout_costs where backout_id = $1`, [backout])
await q(`insert into ops.request_status_history (request_id, status, occurred_on) values ($1, 'Back Out', '2026-06-20')`, [request])
const [{ id: lastStage }] = await q(`select id from ops.request_status_history where request_id = $1 and status = 'Back Out' limit 1`, [request])
await q(`delete from ops.request_status_history where id = $1`, [lastStage])
check((await backouts()).length === 0, 'one with nothing spent on it is')

// --- a candidate who came directly ------------------------------------------
await q(`update ops.applicants set agent_id = null where id = $1`, [worker])
check((await commissions()).every((c) => c.status === 'Paid'),
  'detaching the agent clears what is unpaid and keeps what is not',
  JSON.stringify(await commissions()))

// --- running it again changes nothing ---------------------------------------
const before = JSON.stringify([await commissions(), await charges(), await backouts()])
await q(`select ops.rebuild_derived_billing()`)
check(before === JSON.stringify([await commissions(), await charges(), await backouts()]),
  'rebuilding from the stage log changes nothing that was already right')

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}`)
await db.close()
process.exit(failures === 0 ? 0 : 1)
