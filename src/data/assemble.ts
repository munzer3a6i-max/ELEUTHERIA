/*
  Database rows, back into the shapes the app works in.

  The mirror of project.ts. Children arrive as their own tables and are folded
  back into the records they belong to, in the order the app expects to find
  them: a worker's stages oldest first, her notes newest first.

  Pure, so scripts/test-rows.mjs can take the app's own data out through the
  mappers, into a real Postgres, back out again, and compare it with what it
  started as.
*/

import * as rows from './rows'
import type { Row, TableName } from './project'
import type {
  AgencyCharge,
  AgencyContract,
  Agent,
  AgentCommission,
  Applicant,
  AppNotification,
  Backout,
  City,
  Country,
  Employer,
  Invoice,
  OfficeExpense,
  PaymentSource,
  PayrollEntry,
  Profession,
  RecruitmentAgency,
  RecruitmentRequest,
  StaffMember,
} from '../types'

export type Tables = Partial<Record<TableName, Row[]>>

export interface Assembled {
  countries: Country[]
  cities: City[]
  professions: Profession[]
  paymentSources: PaymentSource[]
  staff: StaffMember[]
  agencies: RecruitmentAgency[]
  agents: Agent[]
  employers: Employer[]
  applicants: Applicant[]
  requests: RecruitmentRequest[]
  invoices: Invoice[]
  payroll: PayrollEntry[]
  officeExpenses: OfficeExpense[]
  agencyContracts: AgencyContract[]
  agencyCharges: AgencyCharge[]
  agentCommissions: AgentCommission[]
  backouts: Backout[]
  notifications: AppNotification[]
}

/** Groups child rows by the parent they point at. */
function by(rowsIn: Row[] | undefined, key: string): Map<string, Row[]> {
  const grouped = new Map<string, Row[]>()
  for (const row of rowsIn ?? []) {
    const parent = String(row[key])
    const list = grouped.get(parent)
    if (list) list.push(row)
    else grouped.set(parent, [row])
  }
  return grouped
}

const oldestFirst = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const newestFirst = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0)

export function assemble(tables: Tables): Assembled {
  const experience = by(tables.applicant_experience, 'applicant_id')
  const education = by(tables.applicant_education, 'applicant_id')
  const documents = by(tables.applicant_documents, 'applicant_id')
  const notes = by(tables.applicant_notes, 'applicant_id')
  const history = by(tables.request_status_history, 'request_id')
  const payments = by(tables.invoice_payments, 'invoice_id')
  const costs = by(tables.backout_costs, 'backout_id')

  return {
    countries: (tables.countries ?? []).map(rows.countryRows.in),
    cities: (tables.cities ?? []).map(rows.cityRows.in),
    professions: (tables.professions ?? []).map(rows.professionRows.in),
    paymentSources: (tables.payment_sources ?? []).map(rows.paymentSourceRows.in),
    staff: (tables.staff ?? []).map(rows.staffRows.in),
    agencies: (tables.agencies ?? []).map(rows.agencyRows.in),
    agents: (tables.agents ?? []).map(rows.agentRows.in),
    employers: (tables.employers ?? []).map(rows.employerRows.in),

    applicants: (tables.applicants ?? []).map((row) => {
      const applicant = rows.applicantRows.in(row)
      applicant.experience = (experience.get(applicant.id) ?? []).map(rows.experienceRows.in)
      applicant.education = (education.get(applicant.id) ?? []).map(rows.educationRows.in)
      applicant.documents = (documents.get(applicant.id) ?? []).map(rows.documentRows.in)
      // Notes read newest first, the way the profile shows them.
      applicant.notes = (notes.get(applicant.id) ?? [])
        .map(rows.noteRows.in)
        .sort((a, b) => newestFirst(a.date, b.date))
      return applicant
    }),

    requests: (tables.requests ?? []).map((row) => {
      const request = rows.requestRows.in(row)
      // The stage log is a sequence: it only means anything in order.
      request.statusHistory = (history.get(request.id) ?? [])
        .map(rows.statusHistoryRows.in)
        .sort((a, b) => oldestFirst(a.date, b.date))
      return request
    }),

    invoices: (tables.invoices ?? []).map((row) => {
      const invoice = rows.invoiceRows.in(row)
      invoice.payments = (payments.get(invoice.id) ?? [])
        .map(rows.paymentRows.in)
        .sort((a, b) => oldestFirst(a.date, b.date))
      return invoice
    }),

    payroll: (tables.payroll_entries ?? []).map(rows.payrollRows.in),
    officeExpenses: (tables.office_expenses ?? []).map(rows.officeExpenseRows.in),
    agencyContracts: (tables.agency_contracts ?? []).map(rows.contractRows.in),
    agencyCharges: (tables.agency_charges ?? []).map(rows.chargeRows.in),
    agentCommissions: (tables.agent_commissions ?? []).map(rows.commissionRows.in),

    backouts: (tables.backouts ?? []).map((row) => {
      const backout = rows.backoutRows.in(row)
      backout.costs = (costs.get(backout.id) ?? [])
        .map(rows.backoutCostRows.in)
        .sort((a, b) => oldestFirst(a.date, b.date))
      return backout
    }),

    notifications: (tables.notifications ?? []).map(rows.notificationRows.in),
  }
}
