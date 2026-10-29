/*
  What the Leads page works out from the rows: which enquiries are overdue,
  which have never been answered, what order they are worked in, and how each
  time reads.

  Every time on the page is shown in Arabia Standard Time, the clock the
  employers keep, whatever machine the page is open on -- an office in Manila
  and an employer in Riyadh have to mean the same "today". Instants are stored
  as instants; only the reading of them is pinned to AST.
*/

import type { Lead, LeadActivity, LeadSource, LeadStage } from '../types'

export const AST = 'Asia/Riyadh'

export const LEAD_SOURCES: LeadSource[] = ['Manual entry', 'WhatsApp', 'Email', 'Website form']
export const LEAD_STAGES: LeadStage[] = ['New enquiry', 'Qualified', 'Proposal sent', 'Shortlisting', 'Won', 'Lost']
export const LEAD_CHANNELS = ['WhatsApp', 'Email', 'Call', 'Meeting'] as const

/** The road a lead walks when it goes well; Lost is the way off it. */
export const LEAD_PATH: LeadStage[] = ['New enquiry', 'Qualified', 'Proposal sent', 'Shortlisting', 'Won']

/** The stages between a first answer and a decision. */
const IN_PROGRESS: LeadStage[] = ['Qualified', 'Proposal sent', 'Shortlisting']

/** "LD-1029" */
export const leadRef = (lead: Lead) => `LD-${lead.refNo || '—'}`

/** A lead saved before a field existed gets that field's empty value. */
export function withLeadDefaults(lead: Partial<Lead> & { id: string }): Lead {
  const legacy = lead as Partial<Lead> & { createdOn?: string }
  return {
    refNo: 0,
    employerName: '',
    contactName: '',
    contactRole: '',
    phone: '',
    email: '',
    industry: '',
    city: '',
    country: '',
    need: '',
    enquiry: '',
    experience: '',
    targetStart: '',
    requirements: '',
    source: 'WhatsApp',
    stage: 'New enquiry',
    stageChangedAt: '',
    contacted: Boolean(lead.lastContactAt),
    ownerId: '',
    receivedOn: '',
    lastContactAt: '',
    lastContactChannel: '',
    nextFollowUpAt: '',
    nextStep: '',
    nextStepDetail: '',
    notes: '',
    document: null,
    ...lead,
    activities: lead.activities ?? [],
    createdAt: lead.createdAt ?? (legacy.createdOn ? `${legacy.createdOn}T00:00:00.000Z` : ''),
  }
}

/** Newest first, the order a history is read in. */
export function sortActivities(activities: LeadActivity[]): LeadActivity[] {
  return [...activities].sort((a, b) => b.at.localeCompare(a.at))
}

/** The positions they want, short; the start of the enquiry when nobody wrote that. */
export function needLine(lead: Lead): string {
  if (lead.need) return lead.need
  const first = lead.enquiry.split(/\n|\. /)[0].trim()
  return first.length > 60 ? `${first.slice(0, 57)}…` : first
}

/** "26 Oct 2026 · 09:12", the time added only when the day it was entered is the day it came. */
export function receivedWhen(lead: Lead): string {
  if (!lead.receivedOn) return '—'
  const [year, month, day] = lead.receivedOn.split('-').map(Number)
  const date = `${day} ${MONTHS[month - 1]} ${year}`
  return lead.createdAt && astToday(new Date(lead.createdAt)) === lead.receivedOn ? `${date} · ${clock(lead.createdAt)}` : date
}

/** Whole Riyadh calendar days since an instant. */
export function daysSince(at: string, now: Date): number {
  return Math.max(0, astDayNumber(now) - astDayNumber(at))
}

/** "28 Oct" */
export function shortDate(at: string): string {
  const p = astParts(at)
  return `${p.day} ${MONTHS[p.month - 1]}`
}

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

export const isContacted = (lead: Lead) => lead.contacted || lead.lastContactAt !== ''
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
    'Reference', 'Employer', 'Contact', 'Role', 'Phone', 'Email', 'Industry', 'City', 'Country', 'Positions',
    'Enquiry', 'Experience', 'Target start', 'Requirements', 'Source', 'Contact status', 'Stage',
    'Owner', 'Received', 'Last contact (AST)', 'Last contact via', 'Next follow-up (AST)', 'Next step',
  ]
  const rows = leads.map((lead) => [
    leadRef(lead), lead.employerName, lead.contactName, lead.contactRole, lead.phone, lead.email, lead.industry,
    lead.city, lead.country, lead.need, lead.enquiry, lead.experience, lead.targetStart, lead.requirements,
    lead.source, isContacted(lead) ? 'Contacted' : 'Not contacted', lead.stage, ownerName(lead.ownerId),
    lead.receivedOn, when(lead.lastContactAt), lead.lastContactChannel, when(lead.nextFollowUpAt), lead.nextStep,
  ])
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\n')
}
