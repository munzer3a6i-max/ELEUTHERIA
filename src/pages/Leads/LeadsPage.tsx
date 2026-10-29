/*
  Leads: every employer enquiry, and its next step.

  Built from the "Leads overview" frame in the design file. The frame carries
  its own header and navigation; here the page sits inside the dashboard's own,
  with the System pages, so only the frame's main content is reproduced.

  The metrics, the overdue notice and the register all read the same rows: an
  enquiry is overdue when it is still open and its follow-up time has passed
  on the Riyadh clock, and the register is worked overdue-first.
*/

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, FileText, Mail, MessageCircle, Search } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCurrentUser } from '../../lib/useCurrentUser'
import {
  LEAD_SOURCES,
  LEAD_STAGES,
  clock,
  daysOverdue,
  followUpWhen,
  isClosed,
  isContacted,
  isInProgress,
  isOverdue,
  leadsCsv,
  longDate,
  receivedLabel,
  workOrder,
} from '../../lib/leads'
import LeadModal from './LeadModal'
import type { Lead, LeadSource, LeadStage } from '../../types'

const PAGE_SIZE = 10

/** The pill each stage wears in the register, as the design colours them. */
const STAGE_TONE: Record<LeadStage, string> = {
  'New enquiry': 'bg-[#f4f6f9] text-[#69768a]',
  Qualified: 'bg-[#edf3f9] text-[#42688b]',
  Shortlisting: 'bg-[#fbf4e5] text-[#82601d]',
  'Proposal sent': 'bg-[#fbf4e5] text-[#82601d]',
  Won: 'bg-[#eaf5ef] text-[#24735b]',
  Lost: 'bg-[#fdecea] text-[#b5473d]',
}

const SOURCE_ICON: Record<LeadSource, typeof Mail> = {
  WhatsApp: MessageCircle,
  Email: Mail,
  'Website form': FileText,
}

type ContactFilter = 'all' | 'contacted' | 'not-contacted'

/** The design's grey filter field: a label above a 52px rounded box. */
function FilterField({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[12px] font-medium tracking-[0.08em] text-[#4a5568]">{label}</span>
      {children}
    </label>
  )
}

function FilterSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  label: string
}) {
  return (
    <span className="relative flex h-[52px] items-center rounded-[12px] border border-[#d5dee7] bg-[#f5f8fb]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-full w-full appearance-none bg-transparent pe-10 ps-4 text-[15px] text-[#17263c] focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-4 size-[18px] text-[#69768a]" />
    </span>
  )
}

function Metric({
  value,
  label,
  note,
  warm = false,
}: {
  value: number
  label: string
  note: string
  warm?: boolean
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-2.5 rounded-[18px] border p-5 ${
        warm ? 'border-[#735142] bg-[#121f36]' : 'border-[#26334a] bg-[#121f36]'
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <p className={`num text-[44px] font-semibold leading-[1.1] ${warm ? 'text-[#f0b5a6]' : 'text-white'}`}>{value}</p>
        <p className="text-[15px] text-[#9fb2c6]">{label}</p>
      </div>
      <p className="text-[11px] leading-[1.4] text-[#a6b4c9]">{note}</p>
    </div>
  )
}

export default function LeadsPage() {
  const leads = useAppStore((s) => s.leads)
  const staff = useAppStore((s) => s.staff)
  const addLead = useAppStore((s) => s.addLead)
  const updateLead = useAppStore((s) => s.updateLead)
  const deleteLead = useAppStore((s) => s.deleteLead)
  const { canRemove } = useCurrentUser()

  // "Now" moves on its own, so an enquiry tips into overdue while the page is open.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const [channel, setChannel] = useState<LeadSource | 'all'>('all')
  const [query, setQuery] = useState('')
  const [contact, setContact] = useState<ContactFilter>('all')
  const [stage, setStage] = useState<LeadStage | 'all'>('all')
  const [owner, setOwner] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [paging, setPaging] = useState({ filters: '', page: 0 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Lead | 'new' | null>(null)

  const ownerName = (id: string) => staff.find((m) => m.id === id)?.name.en ?? ''

  // --- the four figures, over every lead whatever the filters say ----------
  const bySource = Object.fromEntries(LEAD_SOURCES.map((s) => [s, leads.filter((l) => l.source === s).length])) as Record<LeadSource, number>
  const notContacted = leads.filter((l) => !isContacted(l) && !isClosed(l))
  const inProgress = leads.filter(isInProgress)
  const overdue = leads.filter((l) => isOverdue(l, now))
  const overdueUncontacted = overdue.filter((l) => !isContacted(l)).length

  // --- the register ---------------------------------------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return workOrder(
      leads.filter((l) => {
        if (channel !== 'all' && l.source !== channel) return false
        if (contact === 'contacted' && !isContacted(l)) return false
        if (contact === 'not-contacted' && isContacted(l)) return false
        if (stage !== 'all' && l.stage !== stage) return false
        if (owner !== 'all' && l.ownerId !== owner) return false
        if (overdueOnly && !isOverdue(l, now)) return false
        if (!q) return true
        return [l.employerName, l.contactName, l.need, l.city, l.phone, l.email].some((v) => v.toLowerCase().includes(q))
      }),
      now,
    )
  }, [leads, channel, contact, stage, owner, overdueOnly, query, now])

  // A page number belongs to the filters it was chosen under: change what is
  // listed and the register starts again at the first page.
  const filters = [channel, contact, stage, owner, overdueOnly, query].join('|')
  const page = paging.filters === filters ? paging.page : 0
  const setPage = (next: number) => setPaging({ filters, page: next })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  const allShownSelected = shown.length > 0 && shown.every((l) => selected.has(l.id))
  function toggleAll() {
    setSelected((was) => {
      const next = new Set(was)
      for (const lead of shown) {
        if (allShownSelected) next.delete(lead.id)
        else next.add(lead.id)
      }
      return next
    })
  }
  function toggleOne(id: string) {
    setSelected((was) => {
      const next = new Set(was)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** The ticked leads, or every lead the filters show when none is ticked. */
  function exportLeads() {
    const chosen = selected.size > 0 ? filtered.filter((l) => selected.has(l.id)) : filtered
    const blob = new Blob([`﻿${leadsCsv(chosen, ownerName)}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const chip = (value: LeadSource | 'all', label: string, count: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setChannel(value)}
      aria-pressed={channel === value}
      className={`rounded-[99px] px-[18px] py-2.5 text-[15px] font-medium whitespace-nowrap ${
        channel === value ? 'bg-[#0b182b] text-white' : 'bg-[#f4f6f9] text-[#69768a] hover:text-[#17263c]'
      }`}
    >
      {label} · {count}
    </button>
  )

  const from = filtered.length === 0 ? 0 : current * PAGE_SIZE + 1
  const to = current * PAGE_SIZE + shown.length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      {/* --- heading ----------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[34px] font-medium leading-none text-ink">Leads</h1>
          <p className="text-[14px] leading-[1.4] text-[#a6b4c9]">Every enquiry. A clear next step.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportLeads}
            disabled={filtered.length === 0}
            className="rounded-[999px] border border-[#506078] bg-white/[0.04] px-6 py-[13px] text-[17px] font-medium text-white hover:bg-white/[0.08] disabled:opacity-40"
          >
            {selected.size > 0 ? `Export ${selected.size} selected` : 'Export leads'}
          </button>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-[999px] bg-[#e5b44d] px-6 py-[13px] text-[17px] font-medium text-[#0b1b2b] hover:bg-[#ecc263]"
          >
            + Add lead
          </button>
        </div>
      </div>

      {/* --- summary metrics ---------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          value={leads.length}
          label="Total employer enquiries"
          note={`${bySource.WhatsApp} WhatsApp · ${bySource.Email} Email · ${bySource['Website form']} Website`}
        />
        <Metric value={notContacted.length} label="Not contacted" note="Awaiting a first response" />
        <Metric value={inProgress.length} label="In progress" note="Qualified through shortlisting" />
        <Metric value={overdue.length} label="Overdue follow-ups" note="Prioritise these enquiries today" warm />
      </div>

      {/* --- priority notice ---------------------------------------------- */}
      {overdue.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#806632] bg-[rgba(229,180,77,0.06)] px-[18px] py-3">
          <p className="flex items-center gap-2.5 text-[13px] leading-[1.4] text-[#e5d8b8]">
            <span aria-hidden="true" className="text-[16px] text-[#e5b44d]">
              !
            </span>
            {overdue.length === 1 ? '1 follow-up is overdue' : `${overdue.length} follow-ups are overdue`}
            {overdueUncontacted > 0 &&
              ` — including ${overdueUncontacted} ${overdueUncontacted === 1 ? 'enquiry that has' : 'enquiries that have'} not been contacted`}
            .
          </p>
          <button
            type="button"
            onClick={() => setOverdueOnly((v) => !v)}
            className="text-[13px] font-medium leading-[1.4] text-[#e5b44d] hover:underline"
          >
            {overdueOnly ? 'Show every lead →' : 'Review overdue →'}
          </button>
        </div>
      )}

      {/* --- the register -------------------------------------------------- */}
      <div className="overflow-hidden rounded-[18px] bg-white text-[#17263c]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {chip('all', 'All channels', leads.length)}
            {LEAD_SOURCES.map((source) => chip(source, source, bySource[source]))}
          </div>
          <p className="text-[12px] leading-[1.4] text-[#69768a]">
            {leads.length} employer {leads.length === 1 ? 'enquiry' : 'enquiries'}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4 px-6 pb-5">
          <FilterField label="SEARCH LEADS" className="min-w-[240px] flex-1">
            <span className="flex h-[52px] items-center gap-2 rounded-[12px] border border-[#d5dee7] bg-[#f5f8fb] px-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employer, contact or recruitment need…"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-[#17263c] placeholder:text-[#8a99ab] focus:outline-none"
              />
              <Search aria-hidden="true" className="size-[18px] shrink-0 text-[#69768a]" />
            </span>
          </FilterField>
          <FilterField label="CONTACT STATUS" className="w-full sm:w-[210px]">
            <FilterSelect value={contact} onChange={(v) => setContact(v as ContactFilter)} label="Contact status">
              <option value="all">All statuses</option>
              <option value="contacted">Contacted</option>
              <option value="not-contacted">Not contacted</option>
            </FilterSelect>
          </FilterField>
          <FilterField label="PROCESS STAGE" className="w-full sm:w-[210px]">
            <FilterSelect value={stage} onChange={(v) => setStage(v as LeadStage | 'all')} label="Process stage">
              <option value="all">All stages</option>
              {LEAD_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </FilterSelect>
          </FilterField>
          <FilterField label="OWNER" className="w-full sm:w-[170px]">
            <FilterSelect value={owner} onChange={setOwner} label="Owner">
              <option value="all">All owners</option>
              {staff
                .filter((m) => leads.some((l) => l.ownerId === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name.en}
                  </option>
                ))}
            </FilterSelect>
          </FilterField>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="flex h-[42px] items-center gap-4 bg-[#f4f6f9] px-6 text-[11px] font-medium text-[#69768a]">
              <input
                type="checkbox"
                checked={allShownSelected}
                onChange={toggleAll}
                aria-label="Select every lead on this page"
                className="size-[18px] shrink-0 accent-[#0b182b]"
              />
              <span className="min-w-0 flex-1">EMPLOYER / ENQUIRY</span>
              <span className="w-[116px] shrink-0">SOURCE</span>
              <span className="w-[138px] shrink-0">CONTACT STATUS</span>
              <span className="w-[148px] shrink-0">PROCESS STAGE</span>
              <span className="w-[136px] shrink-0">LAST CONTACT</span>
              <span className="w-[166px] shrink-0">NEXT FOLLOW-UP</span>
              <span className="w-[18px] shrink-0" />
            </div>

            {shown.map((lead) => {
              const SourceIcon = SOURCE_ICON[lead.source]
              const contacted = isContacted(lead)
              const late = isOverdue(lead, now)
              const subtitle = [lead.contactName, lead.need, lead.city].filter(Boolean).join(' · ')
              return (
                <div
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditing(lead)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditing(lead)
                  }}
                  className="group flex h-[66px] cursor-pointer items-center gap-4 border-b border-s-[3px] border-[#e3e8ef] border-s-transparent bg-white px-6 outline-none hover:border-s-[#e5b44d] hover:bg-[#fcf8ee] focus-visible:border-s-[#e5b44d] focus-visible:bg-[#fcf8ee]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${lead.employerName}`}
                    className="size-[18px] shrink-0 accent-[#0b182b]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.4]">
                    <p className="truncate text-[14px] font-medium text-[#17263c]">{lead.employerName}</p>
                    <p className="truncate text-[11px] text-[#69768a]">{subtitle}</p>
                  </div>
                  <div className="flex w-[116px] shrink-0 items-center gap-[7px]">
                    <SourceIcon aria-hidden="true" className="size-[17px] shrink-0 text-[#e5b44d]" />
                    <span className="text-[13px] leading-[1.4] whitespace-nowrap text-[#17263c]">{lead.source}</span>
                  </div>
                  <div className="flex w-[138px] shrink-0 items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${contacted ? 'bg-[#24735b]' : 'bg-[#b5473d]'}`}
                    />
                    <span className={`text-[13px] font-medium leading-[1.4] whitespace-nowrap ${contacted ? 'text-[#24735b]' : 'text-[#b5473d]'}`}>
                      {contacted ? 'Contacted' : 'Not contacted'}
                    </span>
                  </div>
                  <div className="w-[148px] shrink-0">
                    <span className={`inline-block rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium leading-[1.4] whitespace-nowrap ${STAGE_TONE[lead.stage]}`}>
                      {lead.stage}
                    </span>
                  </div>
                  <div className="flex w-[136px] shrink-0 flex-col gap-[3px] leading-[1.4] whitespace-nowrap">
                    {contacted ? (
                      <>
                        <span className="text-[12px] text-[#17263c]">{longDate(lead.lastContactAt)}</span>
                        <span className="text-[11px] text-[#69768a]">
                          {clock(lead.lastContactAt)}
                          {lead.lastContactChannel && ` · ${lead.lastContactChannel}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] text-[#69768a]">Not yet contacted</span>
                        <span className="text-[11px] text-[#69768a]">{receivedLabel(lead.receivedOn)}</span>
                      </>
                    )}
                  </div>
                  <div className={`flex w-[166px] shrink-0 flex-col gap-[3px] leading-[1.4] whitespace-nowrap ${late ? 'text-[#b5473d]' : ''}`}>
                    {lead.nextFollowUpAt && !isClosed(lead) ? (
                      <>
                        <span className={`text-[12px] font-medium ${late ? '' : 'text-[#17263c]'}`}>
                          {followUpWhen(lead.nextFollowUpAt, now)}
                        </span>
                        <span className={`truncate text-[11px] ${late ? '' : 'text-[#69768a]'}`}>
                          {late
                            ? `Overdue · ${daysOverdue(lead, now)} ${daysOverdue(lead, now) === 1 ? 'day' : 'days'}`
                            : lead.nextStep || (contacted ? 'Follow up' : 'First response')}
                        </span>
                      </>
                    ) : lead.stage === 'Won' ? (
                      <>
                        <span className="text-[12px] font-medium text-[#17263c]">{lead.nextStep || 'Handover complete'}</span>
                        <span className="text-[11px] text-[#69768a]">Placement team</span>
                      </>
                    ) : lead.stage === 'Lost' ? (
                      <>
                        <span className="text-[12px] font-medium text-[#17263c]">Closed</span>
                        <span className="truncate text-[11px] text-[#69768a]">{lead.nextStep || 'No further action'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] font-medium text-[#17263c]">{lead.nextStep || 'No follow-up set'}</span>
                        <span className="text-[11px] text-[#69768a]">Set a date</span>
                      </>
                    )}
                  </div>
                  <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[#e5b44d]" />
                </div>
              )
            })}

            {shown.length === 0 && (
              <div className="border-b border-[#e3e8ef] px-6 py-12 text-center text-[13px] text-[#69768a]">
                {leads.length === 0
                  ? 'No enquiries yet. Record the first with + Add lead.'
                  : 'No lead matches these filters.'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <p className="text-[12px] leading-[1.4] text-[#69768a]">
            Showing {from}–{to} of {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'} · Overdue enquiries first
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, current - 1))}
              disabled={current === 0}
              aria-label="Previous page"
              className="text-[#e5b44d] disabled:text-[#c7cfda]"
            >
              <ChevronLeft className="size-[18px]" />
            </button>
            <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-[#fbf4e5] text-[12px] font-semibold text-[#17263c]">
              {current + 1}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(pages - 1, current + 1))}
              disabled={current >= pages - 1}
              aria-label="Next page"
              className="text-[#e5b44d] disabled:text-[#c7cfda]"
            >
              <ChevronRight className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2 text-[11px] leading-[1.4] text-[#a6b4c9]">
        <p>All times in Arabia Standard Time (UTC+3)</p>
        <p>Employer enquiries · Internal use only</p>
      </div>

      {editing && (
        <LeadModal
          lead={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            if (editing === 'new') addLead(draft)
            else updateLead(editing.id, draft)
            setEditing(null)
          }}
          onDelete={
            editing !== 'new' && canRemove('system')
              ? () => {
                  if (window.confirm(`Delete the enquiry from ${editing.employerName}? This cannot be undone.`)) {
                    deleteLead(editing.id)
                    setSelected((was) => {
                      const next = new Set(was)
                      next.delete(editing.id)
                      return next
                    })
                    setEditing(null)
                  }
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
