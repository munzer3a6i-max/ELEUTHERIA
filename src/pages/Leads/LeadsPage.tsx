/*
  Leads: every employer enquiry, and its next step.

  Built from the "Leads overview" frame in the design file -- its figures, its
  overdue notice, its channel tabs, filters and register -- in the dashboard's
  own sizes, so it reads like the pages beside it.

  The figures, the notice and the register all read the same rows: an enquiry
  is overdue when it is still open and its follow-up time has passed on the
  Riyadh clock, and the register is worked overdue-first.
*/

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Plus, Search, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'
import StatStrip from '../../components/StatStrip'
import { PrimaryButton, SecondaryButton, SelectInput } from '../../components/form'
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
  needLine,
  receivedLabel,
  workOrder,
} from '../../lib/leads'
import { DataContext, FilterTab } from './leadUi'
import { SOURCE_ICON, STAGE_CHIP } from './leadStyle'
import type { Lead, LeadSource, LeadStage } from '../../types'

const PAGE_SIZE = 10

type ContactFilter = 'all' | 'contacted' | 'not-contacted'

/** The next follow-up cell: when, and what for -- or why there is none. */
function FollowUp({ lead, now }: { lead: Lead; now: Date }) {
  const late = isOverdue(lead, now)
  if (lead.nextFollowUpAt && !isClosed(lead)) {
    const days = daysOverdue(lead, now)
    return (
      <>
        <p className={`font-medium ${late ? 'text-neg' : 'text-ink'}`}>{followUpWhen(lead.nextFollowUpAt, now)}</p>
        <p className={`truncate text-[11px] ${late ? 'text-neg' : 'text-ink-3'}`}>
          {late
            ? `Overdue · ${days} ${days === 1 ? 'day' : 'days'}`
            : lead.nextStep || (isContacted(lead) ? 'Follow up' : 'First response')}
        </p>
      </>
    )
  }
  const [first, second] =
    lead.stage === 'Won'
      ? [lead.nextStep || 'Handover complete', 'Placement team']
      : lead.stage === 'Lost'
        ? ['Closed', lead.nextStep || 'No further action']
        : [lead.nextStep || 'No follow-up set', 'Set a date']
  return (
    <>
      <p className="font-medium text-ink">{first}</p>
      <p className="truncate text-[11px] text-ink-3">{second}</p>
    </>
  )
}

export default function LeadsPage() {
  const leads = useAppStore((s) => s.leads)
  const staff = useAppStore((s) => s.staff)
  const navigate = useNavigate()

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
        return [l.employerName, l.contactName, l.need, l.enquiry, l.city, l.phone, l.email].some((v) => v.toLowerCase().includes(q))
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

  const from = filtered.length === 0 ? 0 : current * PAGE_SIZE + 1
  const to = current * PAGE_SIZE + shown.length
  // Manual entries get a tab of their own only once there are some.
  const channels = LEAD_SOURCES.filter((source) => source !== 'Manual entry' || bySource[source] > 0)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title="Leads"
        subtitle="Every enquiry. A clear next step."
        actions={
          <>
            <SecondaryButton onClick={exportLeads} disabled={filtered.length === 0} className="flex items-center gap-1.5">
              <Download className="size-3.5" />
              {selected.size > 0 ? `Export ${selected.size} selected` : 'Export leads'}
            </SecondaryButton>
            <PrimaryButton onClick={() => navigate('/leads/new')} className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> Add lead
            </PrimaryButton>
          </>
        }
      />

      <StatStrip
        stats={[
          {
            label: 'Total employer enquiries',
            value: String(leads.length),
            note: [
              `${bySource.WhatsApp} WhatsApp`,
              `${bySource.Email} Email`,
              `${bySource['Website form']} Website`,
              ...(bySource['Manual entry'] > 0 ? [`${bySource['Manual entry']} Manual`] : []),
            ].join(' · '),
            lead: true,
          },
          { label: 'Not contacted', value: String(notContacted.length), note: 'Awaiting a first response' },
          { label: 'In progress', value: String(inProgress.length), note: 'Qualified through shortlisting' },
          {
            label: 'Overdue follow-ups',
            value: String(overdue.length),
            note: 'Prioritise these enquiries today',
            tone: overdue.length > 0 ? 'neg' : undefined,
          },
        ]}
      />

      {overdue.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-panel border border-accent-line bg-accent-soft px-3.5 py-2.5">
          <p className="flex items-center gap-2 text-[12px] text-ink-2">
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0 text-accent-text" />
            {overdue.length === 1 ? '1 follow-up is overdue' : `${overdue.length} follow-ups are overdue`}
            {overdueUncontacted > 0 &&
              ` — including ${overdueUncontacted} ${overdueUncontacted === 1 ? 'enquiry that has' : 'enquiries that have'} not been contacted`}
            .
          </p>
          <button type="button" onClick={() => setOverdueOnly((v) => !v)} className="text-[12px] font-medium text-accent-text hover:underline">
            {overdueOnly ? 'Show every lead →' : 'Review overdue →'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <FilterTab active={channel === 'all'} onClick={() => setChannel('all')}>
            All channels · {leads.length}
          </FilterTab>
          {channels.map((source) => (
            <FilterTab key={source} active={channel === source} onClick={() => setChannel(source)}>
              {source} · {bySource[source]}
            </FilterTab>
          ))}
        </div>
        <p className="text-[11px] text-ink-3">
          {leads.length} employer {leads.length === 1 ? 'enquiry' : 'enquiries'}
        </p>
      </div>

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-1 gap-3 border-b border-line p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]">
          <label className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employer, contact or recruitment need…"
              aria-label="Search leads"
              className="field ps-8"
            />
          </label>
          <SelectInput value={contact} onChange={(e) => setContact(e.target.value as ContactFilter)} aria-label="Contact status">
            <option value="all">All statuses</option>
            <option value="contacted">Contacted</option>
            <option value="not-contacted">Not contacted</option>
          </SelectInput>
          <SelectInput value={stage} onChange={(e) => setStage(e.target.value as LeadStage | 'all')} aria-label="Process stage">
            <option value="all">All stages</option>
            {LEAD_STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectInput>
          <SelectInput value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
            <option value="all">All owners</option>
            {staff
              .filter((m) => leads.some((l) => l.ownerId === m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.en}
                </option>
              ))}
          </SelectInput>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[960px]">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    checked={allShownSelected}
                    onChange={toggleAll}
                    aria-label="Select every lead on this page"
                    className="accent-accent"
                  />
                </th>
                <th>Employer / enquiry</th>
                <th>Source</th>
                <th>Contact status</th>
                <th>Process stage</th>
                <th>Last contact</th>
                <th>Next follow-up</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {shown.map((lead) => {
                const SourceIcon = SOURCE_ICON[lead.source]
                const contacted = isContacted(lead)
                const subtitle = [lead.contactName, needLine(lead), lead.city].filter(Boolean).join(' · ')
                const open = () => navigate(`/leads/${lead.id}`)
                return (
                  <tr
                    key={lead.id}
                    tabIndex={0}
                    onClick={open}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') open()
                    }}
                    className="cursor-pointer text-xs outline-none focus-visible:[&>td]:bg-raised"
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleOne(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${lead.employerName}`}
                        className="accent-accent"
                      />
                    </td>
                    <td className="max-w-[320px]">
                      <p className="truncate font-medium text-ink">{lead.employerName}</p>
                      <p className="truncate text-[11px] text-ink-3">{subtitle}</p>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <SourceIcon aria-hidden="true" className="size-3.5 shrink-0 text-accent-text" />
                        {lead.source}
                      </span>
                    </td>
                    <td>
                      <span className={`flex items-center gap-1.5 font-medium whitespace-nowrap ${contacted ? 'text-pos' : 'text-neg'}`}>
                        <span aria-hidden="true" className={`size-1.5 rounded-full ${contacted ? 'bg-pos' : 'bg-neg'}`} />
                        {contacted ? 'Contacted' : 'Not contacted'}
                      </span>
                    </td>
                    <td>
                      <span className={STAGE_CHIP[lead.stage]}>{lead.stage}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {lead.lastContactAt ? (
                        <>
                          <p className="text-ink">{longDate(lead.lastContactAt)}</p>
                          <p className="text-[11px] text-ink-3">
                            {clock(lead.lastContactAt)}
                            {lead.lastContactChannel && ` · ${lead.lastContactChannel}`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-ink-3">{contacted ? 'Contact not logged' : 'Not yet contacted'}</p>
                          <p className="text-[11px] text-ink-3">{receivedLabel(lead.receivedOn)}</p>
                        </>
                      )}
                    </td>
                    <td className="max-w-[200px] whitespace-nowrap">
                      <FollowUp lead={lead} now={now} />
                    </td>
                    <td>
                      <ChevronRight aria-hidden="true" className="size-4 text-ink-3 rtl:rotate-180" />
                    </td>
                  </tr>
                )
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-ink-3">
                    {leads.length === 0 ? 'No enquiries yet. Record the first with Add lead.' : 'No lead matches these filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
          <p className="text-[11px] text-ink-3">
            Showing {from}–{to} of {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'} · Overdue enquiries first
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, current - 1))}
              disabled={current === 0}
              aria-label="Previous page"
              className="btn btn-ghost size-7 p-0"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </button>
            <span className="num flex size-7 items-center justify-center rounded-control bg-accent-soft text-[11px] font-semibold text-accent-text">
              {current + 1}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(pages - 1, current + 1))}
              disabled={current >= pages - 1}
              aria-label="Next page"
              className="btn btn-ghost size-7 p-0"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <DataContext right="Employer enquiries · Internal use only" />
    </div>
  )
}
