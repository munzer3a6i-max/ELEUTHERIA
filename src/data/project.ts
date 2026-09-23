/*
  The whole store, seen as database rows.

  Writing every change through by hand would mean touching sixty actions and
  remembering to touch the sixty-first. Instead the store is projected into the
  rows it would be if it lived in the database, and two projections are
  compared: whatever differs is what needs saving. An action that nobody
  thought about still saves correctly, because nothing depends on the action
  having been thought about.

  Order matters and is fixed here: parents before children when writing, the
  reverse when deleting, because that is what the foreign keys require.
*/

import * as rows from './rows'
import type { AppState } from '../store/useAppStore'

export type TableName = string
export type Row = Record<string, unknown>
/** Every row of every table, by id, so two states can be compared cheaply. */
export type Projection = Map<TableName, Map<string, Row>>

/** Parents first. Deletes walk this backwards. */
export const TABLE_ORDER: TableName[] = [
  'settings',
  'countries',
  'cities',
  'professions',
  'payment_sources',
  'staff',
  'agencies',
  'agents',
  'employers',
  'applicants',
  'applicant_experience',
  'applicant_education',
  'applicant_documents',
  'applicant_notes',
  'requests',
  'request_status_history',
  'invoices',
  'invoice_payments',
  'payroll_entries',
  'office_expenses',
  'agency_contracts',
  'agency_charges',
  'agent_commissions',
  'backouts',
  'backout_costs',
  'notifications',
]

type Slice = Pick<
  AppState,
  | 'settings'
  | 'countries' | 'cities' | 'professions' | 'paymentSources' | 'staff' | 'agencies' | 'agents'
  | 'employers' | 'applicants' | 'requests' | 'invoices' | 'payroll' | 'officeExpenses'
  | 'agencyContracts' | 'agencyCharges' | 'agentCommissions' | 'backouts' | 'notifications'
>

export function project(state: Slice): Projection {
  const projection: Projection = new Map(TABLE_ORDER.map((table) => [table, new Map()]))
  const put = (table: TableName, row: Row) => projection.get(table)!.set(String(row.id), row)

  put('settings', rows.settingsRows.out(state.settings))
  for (const c of state.countries) put('countries', rows.countryRows.out(c))
  for (const c of state.cities) put('cities', rows.cityRows.out(c))
  for (const p of state.professions) put('professions', rows.professionRows.out(p))
  for (const p of state.paymentSources) put('payment_sources', rows.paymentSourceRows.out(p))
  for (const m of state.staff) put('staff', rows.staffRows.out(m))
  for (const a of state.agencies) put('agencies', rows.agencyRows.out(a))
  for (const a of state.agents) put('agents', rows.agentRows.out(a))
  for (const e of state.employers) put('employers', rows.employerRows.out(e))

  for (const a of state.applicants) {
    put('applicants', rows.applicantRows.out(a))
    for (const e of a.experience) put('applicant_experience', rows.experienceRows.out(e, a.id))
    for (const e of a.education) put('applicant_education', rows.educationRows.out(e, a.id))
    for (const d of a.documents) put('applicant_documents', rows.documentRows.out(d, a.id))
    for (const n of a.notes) put('applicant_notes', rows.noteRows.out(n, a.id))
  }

  for (const r of state.requests) {
    put('requests', rows.requestRows.out(r))
    for (const h of r.statusHistory) put('request_status_history', rows.statusHistoryRows.out(h, r.id))
  }

  for (const i of state.invoices) {
    put('invoices', rows.invoiceRows.out(i))
    for (const p of i.payments) put('invoice_payments', rows.paymentRows.out(p, i.id))
  }

  for (const e of state.payroll) put('payroll_entries', rows.payrollRows.out(e))
  for (const e of state.officeExpenses) put('office_expenses', rows.officeExpenseRows.out(e))
  for (const c of state.agencyContracts) put('agency_contracts', rows.contractRows.out(c))
  for (const c of state.agencyCharges) put('agency_charges', rows.chargeRows.out(c))
  for (const c of state.agentCommissions) put('agent_commissions', rows.commissionRows.out(c))

  for (const b of state.backouts) {
    put('backouts', rows.backoutRows.out(b))
    for (const c of b.costs) put('backout_costs', rows.backoutCostRows.out(c, b.id))
  }

  for (const n of state.notifications) put('notifications', rows.notificationRows.out(n))

  return projection
}

export interface Change {
  table: TableName
  /** Rows to insert or update, parents first. */
  upserts: Row[]
  /** Ids to remove. Applied children first, which is the reverse of this list. */
  deletes: string[]
}

/** What changed between two projections, and nothing else. */
export function diff(before: Projection, after: Projection): Change[] {
  const changes: Change[] = []

  for (const table of TABLE_ORDER) {
    const was = before.get(table) ?? new Map()
    const now = after.get(table) ?? new Map()
    const upserts: Row[] = []
    const deletes: string[] = []

    for (const [id, row] of now) {
      const previous = was.get(id)
      if (!previous || JSON.stringify(previous) !== JSON.stringify(row)) upserts.push(row)
    }
    for (const id of was.keys()) {
      if (!now.has(id)) deletes.push(id)
    }

    if (upserts.length > 0 || deletes.length > 0) changes.push({ table, upserts, deletes })
  }

  return changes
}

/** Everything, as if nothing were there before: the first save of a fresh project. */
export function everything(projection: Projection): Change[] {
  return diff(new Map(TABLE_ORDER.map((table) => [table, new Map()])), projection)
}
