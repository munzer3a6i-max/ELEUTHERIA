// What the app would send to the database, and when.
//
//   npm run dev          (in another terminal, with no .env.local)
//   node scripts/test-sync.mjs
//
// The saving path has one idea in it: project the store into rows, and send
// whatever differs from last time. This checks that idea against real edits --
// that a change produces exactly the rows it should and no others, that a
// delete is a delete, that nested records travel with their parent, and that a
// row edited twice is sent once.

import { chromium } from 'playwright'

const BASE = process.env.APP_URL ?? 'http://localhost:5180'
let failures = 0
const check = (passed, label, detail = '') => {
  console.log(`${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!passed) failures += 1
}

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })

const results = await page.evaluate(async () => {
  const { project, diff } = await import('/src/data/project.ts')
  const { useAppStore } = await import('/src/store/useAppStore.ts')

  const store = useAppStore.getState()
  // Sign in locally so the role permits the edits below.
  const admin = store.staff.find((m) => m.role === 'admin')
  useAppStore.setState({ currentStaffId: admin.id })

  const out = {}
  const snapshot = () => project(useAppStore.getState())
  const changed = (before) => diff(before, snapshot()).map((c) => ({
    table: c.table, upserts: c.upserts.length, deletes: c.deletes.length,
  }))

  // Nothing happened.
  let before = snapshot()
  out.quiet = changed(before)

  // One new expense is one new row.
  before = snapshot()
  useAppStore.getState().addOfficeExpense({
    item: { en: 'Courier', ar: '' }, category: 'Logistics', amount: 25,
    date: '2026-09-23', status: 'Pending', attachment: null,
  })
  out.added = changed(before)

  // Editing it sends that row again, and nothing else.
  const expense = useAppStore.getState().officeExpenses[0]
  before = snapshot()
  useAppStore.getState().updateOfficeExpense(expense.id, { amount: 30 })
  out.edited = changed(before)
  out.editedAmount = diff(before, snapshot())[0]?.upserts[0]?.amount

  // Removing it is a delete, not an update.
  before = snapshot()
  useAppStore.getState().deleteOfficeExpense(expense.id)
  out.removed = changed(before)

  // A stage update travels with the money the app derives from it, while the
  // app is the one deriving it.
  const request = useAppStore.getState().requests.find((r) => r.statusHistory.length > 0)
  before = snapshot()
  useAppStore.getState().addStatusUpdate(request.id, {
    status: 'Biometric', date: '2026-09-23', cost: 5,
    paymentSourceId: useAppStore.getState().paymentSources[0].id,
    responsibleEmployeeId: admin.id, attachment: null, notes: '',
  })
  out.stage = changed(before)

  // A worker's note lives in its own table and travels on its own.
  const applicant = useAppStore.getState().applicants[0]
  before = snapshot()
  useAppStore.getState().addApplicantNote(applicant.id, 'Called about her medical.')
  out.note = changed(before)

  // Two edits to the same row, sent once.
  const { merge } = await import('/src/data/project.ts').then(async () => {
    const sync = await import('/src/data/sync.ts')
    return { merge: sync.__mergeForTests }
  })
  const twice = merge([
    { table: 'office_expenses', upserts: [{ id: 'a', amount: 1 }], deletes: [] },
    { table: 'office_expenses', upserts: [{ id: 'a', amount: 2 }], deletes: [] },
  ])
  out.merged = twice

  const dropped = merge([
    { table: 'office_expenses', upserts: [{ id: 'b', amount: 1 }], deletes: [] },
    { table: 'office_expenses', upserts: [], deletes: ['b'] },
  ])
  out.mergedDelete = dropped

  return out
})
await browser.close()

const only = (changes, table) => changes.length === 1 && changes[0].table === table
check(results.quiet.length === 0, 'an untouched store sends nothing')
check(only(results.added, 'office_expenses') && results.added[0].upserts === 1,
  'a new expense is one row', JSON.stringify(results.added))
check(only(results.edited, 'office_expenses') && results.edited[0].upserts === 1 && results.editedAmount === 30,
  'editing it sends that row and no others', JSON.stringify(results.edited))
check(only(results.removed, 'office_expenses') && results.removed[0].deletes === 1,
  'removing it is a delete', JSON.stringify(results.removed))
// The request row itself does not move: its only change is updated_at, which
// the database stamps for itself, so there is nothing to send.
check(only(results.stage, 'request_status_history') && results.stage[0].upserts === 1,
  'a logged stage sends the stage and nothing else', JSON.stringify(results.stage))
check(only(results.note, 'applicant_notes') && results.note[0].upserts === 1,
  'a note travels in its own table', JSON.stringify(results.note))
check(results.merged.length === 1 && results.merged[0].upserts.length === 1 && results.merged[0].upserts[0].amount === 2,
  'a row edited twice is sent once, with the later value', JSON.stringify(results.merged))
check(results.mergedDelete.length === 1 && results.mergedDelete[0].upserts.length === 0 &&
      results.mergedDelete[0].deletes.length === 1,
  'a row created and then removed is only removed', JSON.stringify(results.mergedDelete))

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} CHECK(S) FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
