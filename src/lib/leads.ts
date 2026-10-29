/*
  What the Leads page works out from the rows: which enquiries are overdue,
  which have never been answered, what order they are worked in, and how each
  time reads.

  Every time on the page is shown in Arabia Standard Time, the clock the
  employers keep, whatever machine the page is open on -- an office in Manila
  and an employer in Riyadh have to mean the same "today". Instants are stored
  as instants; only the reading of them is pinned to AST.
*/

import type { Lead, LeadSource, LeadStage } from '../types'

export const AST = 'Asia/Riyadh'

export const LEAD_SOURCES: LeadSource[] = ['WhatsApp', 'Email', 'Website form']
export const LEAD_STAGES: LeadStage[] = ['New enquiry', 'Qualified', 'Shortlisting', 'Proposal sent', 'Won', 'Lost']
export const LEAD_CHANNELS = ['WhatsApp', 'Email', 'Call', 'Meeting'] as const

/** The stages between a first answer and a decision. */
const IN_PROGRESS: LeadStage[] = ['Qualified', 'Shortlisting', 'Proposal sent']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface AstParts {
  year: number
  month: number
  day: number
  hour: string
  minute: string
}

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: AST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** An instant, read on the Riyadh clock. */
export function astParts(at: Date | string): AstParts {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(at)).map((p) => [p.type, p.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour,
    minute: parts.minute,
  }
}

/** The AST calendar day an instant falls on, as a count of days, for comparing days. */
function astDayNumber(at: Date | string): number {
  const p = astParts(at)
  return Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86_400_000)
}

/** "28 Oct 2026" */
export function longDate(at: string): string {
  const p = astParts(at)
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`
}

/** "16:40" */
export function clock(at: string): string {
  const p = astParts(at)
  return `${p.hour}:${p.minute}`
}

/** "Today · 10:00", or "28 Oct · 17:00" on any other day. */
export function followUpWhen(at: string, now: Date): string {
  const p = astParts(at)
  const day = astDayNumber(at) === astDayNumber(now) ? 'Today' : `${p.day} ${MONTHS[p.month - 1]}`
  return `${day} · ${p.hour}:${p.minute}`
}

/** "Received 28 Oct", from a plain YYYY-MM-DD day. */
export function receivedLabel(receivedOn: string): string {
  const [, month, day] = receivedOn.split('-').map(Number)
  if (!month || !day) return 'Received —'
  return `Received ${day} ${MONTHS[month - 1]}`
}

/** A datetime-local value, read as Riyadh time, to an instant. */
export function fromAstInput(value: string): string {
  if (!value) return ''
  return new Date(`${value}:00+03:00`).toISOString()
}

/** An instant to the datetime-local value that shows it on the Riyadh clock. */
export function toAstInput(at: string): string {
  if (!at) return ''
  const p = astParts(at)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${p.hour}:${p.minute}`
}

/** Today on the Riyadh clock, as YYYY-MM-DD. */
export function astToday(now = new Date()): string {
  const p = astParts(now)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export const isContacted = (lead: Lead) => lead.lastContactAt !== ''
export const isClosed = (lead: Lead) => lead.stage === 'Won' || lead.stage === 'Lost'
export const isInProgress = (lead: Lead) => IN_PROGRESS.includes(lead.stage)

/** Past its follow-up and still open: the enquiries to work first. */
export function isOverdue(lead: Lead, now: Date): boolean {
  return !isClosed(lead) && lead.nextFollowUpAt !== '' && new Date(lead.nextFollowUpAt) < now
}

/** How many Riyadh calendar days late a follow-up is; at least one once it is late at all. */
export function daysOverdue(lead: Lead, now: Date): number {
  return Math.max(1, astDayNumber(now) - astDayNumber(lead.nextFollowUpAt))
}

/**
 * The order the register is worked in: overdue first, the longest-waiting at
 * the top; then the open ones by when they are next due; then open ones with
 * no date set; then the closed ones, newest first.
 */
export function workOrder(leads: Lead[], now: Date): Lead[] {
  const rank = (lead: Lead) =>
    isOverdue(lead, now) ? 0 : isClosed(lead) ? 3 : lead.nextFollowUpAt ? 1 : 2
  return [...leads].sort((a, b) => {
    const byRank = rank(a) - rank(b)
    if (byRank !== 0) return byRank
    if (a.nextFollowUpAt && b.nextFollowUpAt) return a.nextFollowUpAt.localeCompare(b.nextFollowUpAt)
    return b.receivedOn.localeCompare(a.receivedOn)
  })
}

/** The leads as a spreadsheet, every time written on the Riyadh clock. */
export function leadsCsv(leads: Lead[], ownerName: (id: string) => string): string {
  const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const when = (at: string) => (at ? `${longDate(at)} ${clock(at)}` : '')
  const header = [
    'Employer', 'Contact', 'Phone', 'Email', 'Need', 'City', 'Source', 'Contact status', 'Stage',
    'Owner', 'Received', 'Last contact (AST)', 'Last contact via', 'Next follow-up (AST)', 'Next step', 'Notes',
  ]
  const rows = leads.map((lead) => [
    lead.employerName, lead.contactName, lead.phone, lead.email, lead.need, lead.city, lead.source,
    isContacted(lead) ? 'Contacted' : 'Not contacted', lead.stage, ownerName(lead.ownerId), lead.receivedOn,
    when(lead.lastContactAt), lead.lastContactChannel, when(lead.nextFollowUpAt), lead.nextStep, lead.notes,
  ])
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\n')
}
