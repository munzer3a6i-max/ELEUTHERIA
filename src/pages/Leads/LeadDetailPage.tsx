/*
  One lead: who they are, what they want, everything said so far, and what
  happens next.

  Built from the "Selected lead" frame in the design file. Everything on it is
  written by hand: Log contact records a message or call (and with it the last
  contact), Update stage moves the lead and writes the move into the history,
  Mark action complete files the next action away, and notes stay internal.

  Every time is read on the Riyadh clock.
*/

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  Trash2,
  Users,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCurrentUser } from '../../lib/useCurrentUser'
import {
  LEAD_CHANNELS,
  LEAD_PATH,
  LEAD_STAGES,
  clock,
  daysSince,
  fromAstInput,
  isContacted,
  isOverdue,
  leadRef,
  longDate,
  needLine,
  receivedWhen,
  shortDate,
  toAstInput,
} from '../../lib/leads'
import { formatBytes } from '../../lib/attachments'
import { removeLeadDocument, signedLeadDocumentUrl, storageAvailable, uploadLeadDocument } from '../../lib/storage'
import {
  ChoiceCard,
  DataContext,
  Field,
  GhostButton,
  GoldButton,
  LeadDialog,
  LightButton,
  PickerBox,
  TextArea,
  TextBox,
} from './leadUi'
import { SOURCE_ICON, initials } from './leadStyle'
import type { Lead, LeadActivity, LeadChannel, LeadStage } from '../../types'

/** A row of the history: the stored activities plus the enquiry itself, which opens it. */
interface HistoryItem {
  key: string
  icon: typeof Mail
  title: string
  at: string
  body: string
  meta: string
  tab: Tab
}

type Tab = 'all' | 'messages' | 'calls' | 'stages'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All activity' },
  { id: 'messages', label: 'Messages' },
  { id: 'calls', label: 'Calls' },
  { id: 'stages', label: 'Stage changes' },
]

const CHANNEL_ICON: Record<LeadChannel, typeof Mail> = {
  WhatsApp: MessageCircle,
  Email: Mail,
  Call: Phone,
  Meeting: Users,
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lead = useAppStore((s) => s.leads.find((l) => l.id === id) ?? null)
  const staff = useAppStore((s) => s.staff)
  const { canRemove } = useCurrentUser()

  // "Now" moves on its own, so a follow-up tips into overdue while the page is open.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const [dialog, setDialog] = useState<'contact' | 'follow-up' | null>(null)

  if (!lead) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <p className="text-[14px] text-[#a6b4c9]">This lead no longer exists.</p>
        <Link to="/leads" className="text-[13px] font-medium text-[#e5b44d] hover:underline">
          Back to leads →
        </Link>
      </div>
    )
  }

  const nameOf = (staffId: string) => staff.find((m) => m.id === staffId)?.name.en ?? 'Somebody'
  const summary = [lead.industry, [lead.city, lead.country].filter(Boolean).join(', '), needLine(lead)].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      {/* --- breadcrumb ----------------------------------------------------- */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] leading-[1.4]">
        <button
          type="button"
          onClick={() => navigate('/leads')}
          aria-label="Back to leads"
          className="flex size-[26px] items-center justify-center rounded-[7px] bg-[#f4f6f9] text-[#e5b44d] hover:bg-white"
        >
          <ArrowLeft className="size-4" />
        </button>
        <Link to="/leads" className="text-[#a6b4c9] hover:text-ink">
          Leads /
        </Link>
        <span className="truncate text-ink">{lead.employerName}</span>
        <span className="text-[12px] text-[#a6b4c9]">· {leadRef(lead)}</span>
      </nav>

      {/* --- heading -------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-[62px] shrink-0 items-center justify-center rounded-[16px] bg-[#fbf4e5]">
            <Building2 aria-hidden="true" className="size-[30px] text-[#e5b44d]" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="truncate text-[32px] font-medium leading-tight text-ink">{lead.employerName}</h1>
            {summary && <p className="text-[14px] leading-[1.4] text-[#a6b4c9]">{summary}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <GhostButton onClick={() => navigate(`/leads/${lead.id}/edit`)}>Edit lead</GhostButton>
          <GoldButton onClick={() => setDialog('contact')}>Log contact</GoldButton>
        </div>
      </div>

      <ProcessCard lead={lead} now={now} />

      {/* --- details -------------------------------------------------------- */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 xl:grid-cols-[336px_minmax(0,1fr)_332px]">
        <div className="flex flex-col gap-5">
          <ContactCard lead={lead} />
          <BriefCard lead={lead} />
        </div>
        <HistoryCard lead={lead} nameOf={nameOf} />
        <div className="flex flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 xl:col-span-1 xl:flex">
          <NextActionCard lead={lead} now={now} ownerName={lead.ownerId ? nameOf(lead.ownerId) : ''} onReschedule={() => setDialog('follow-up')} />
          <NotesCard lead={lead} nameOf={nameOf} canDelete={canRemove('system')} />
        </div>
      </div>

      <DataContext right="Employer enquiries · Internal use only" />

      {dialog === 'contact' && <LogContactDialog lead={lead} onClose={() => setDialog(null)} />}
      {dialog === 'follow-up' && <FollowUpDialog lead={lead} onClose={() => setDialog(null)} />}
    </div>
  )
}

/* ------------------------------------------------------------ process -- */

function ProcessCard({ lead, now }: { lead: Lead; now: Date }) {
  const setLeadStage = useAppStore((s) => s.setLeadStage)
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<LeadStage>(lead.stage)
  const [note, setNote] = useState('')
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const since = lead.stageChangedAt || lead.createdAt
  const days = since ? daysSince(since, now) : 0
  const current = LEAD_PATH.indexOf(lead.stage)
  const lost = lead.stage === 'Lost'

  return (
    <section className="flex flex-col gap-[22px] rounded-[18px] border border-[#26334a] bg-[#121f36] p-6">
      <div className="relative flex flex-wrap items-start justify-between gap-2 text-[13px] leading-[1.4]">
        <p className="font-medium text-white">Current process</p>
        <p className="text-[12px] text-[#a6b4c9]">
          {since
            ? `${lead.stage} on ${shortDate(since)} · ${days === 0 ? 'today' : `${days} ${days === 1 ? 'day' : 'days'} in stage`}`
            : lead.stage}
        </p>
        <div ref={panel} className="relative">
          <button
            type="button"
            onClick={() => {
              setStage(lead.stage)
              setNote('')
              setOpen((v) => !v)
            }}
            aria-expanded={open}
            className="font-medium text-[#e5b44d] hover:underline"
          >
            Update stage ↓
          </button>
          {open && (
            <div className="absolute end-0 top-7 z-20 flex w-[300px] flex-col gap-3 rounded-[14px] bg-white p-4 text-[#17263c] shadow-2xl">
              <div role="radiogroup" aria-label="Stage" className="flex flex-col gap-1.5">
                {LEAD_STAGES.map((option) => (
                  <ChoiceCard key={option} label={option} selected={stage === option} onSelect={() => setStage(option)} />
                ))}
              </div>
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What moved it? (optional)"
                className="min-h-[64px] text-[13px]"
              />
              <GoldButton
                disabled={stage === lead.stage}
                onClick={() => {
                  setLeadStage(lead.id, stage, note)
                  setOpen(false)
                }}
                className="py-2.5 text-[15px]"
              >
                Move to {stage}
              </GoldButton>
            </div>
          )}
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-4">
        {LEAD_PATH.map((step, index) => {
          const done = !lost && index < current
          const here = !lost && index === current
          const last = index === LEAD_PATH.length - 1
          return (
            <li key={step} className="flex min-w-[150px] flex-1 items-center gap-2.5">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                  done || here ? 'bg-[#e5b44d] text-[#17263c]' : 'bg-[#26334a] text-[#a6b4c9]'
                }`}
              >
                {done ? <Check aria-label="Done" className="size-4" strokeWidth={2.5} /> : index + 1}
              </span>
              <span
                className={`text-[13px] leading-[1.4] whitespace-nowrap ${
                  here ? 'font-semibold text-[#e5b44d]' : done ? 'text-white' : 'text-[#a6b4c9]'
                }`}
              >
                {step}
              </span>
              {!last && <span aria-hidden="true" className={`h-px min-w-4 flex-1 ${done ? 'bg-[#a8853a]' : 'bg-[#26334a]'}`} />}
            </li>
          )
        })}
        {lost && (
          <li className="rounded-[7px] bg-[#fbefec] px-2.5 py-1.5 text-[12px] font-semibold text-[#b5473d]">Lost</li>
        )}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------ the cards -- */

function CardTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-[20px] font-medium text-[#17263c]">{title}</h2>
      {right}
    </div>
  )
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-[5px] leading-[1.4]">
      <p className="text-[11px] font-medium text-[#69768a]">{label}</p>
      <div className="text-[14px] break-words text-[#17263c]">{children || <span className="text-[#8a99ab]">—</span>}</div>
    </div>
  )
}

function ContactCard({ lead }: { lead: Lead }) {
  const contacted = isContacted(lead)
  const SourceIcon = SOURCE_ICON[lead.source]
  const digits = lead.phone.replace(/[^\d]/g, '')

  return (
    <section className="flex flex-col gap-5 rounded-[18px] bg-white p-6 text-[#17263c]">
      <CardTitle title="Contact information" />
      <div className="flex flex-col gap-1.5 leading-[1.4]">
        <p className="text-[17px] font-medium">{lead.contactName || '—'}</p>
        <p className="text-[13px] text-[#69768a]">{[lead.contactRole, 'Primary contact'].filter(Boolean).join(' · ')}</p>
      </div>
      <p className="flex items-center gap-1.5">
        <span aria-hidden="true" className={`size-1.5 rounded-full ${contacted ? 'bg-[#24735b]' : 'bg-[#b5473d]'}`} />
        <span className={`text-[13px] font-medium ${contacted ? 'text-[#24735b]' : 'text-[#b5473d]'}`}>
          {contacted ? 'Contacted' : 'Not contacted'}
        </span>
      </p>
      <hr className="border-[#e3e8ef]" />
      <Labelled label="PHONE / WHATSAPP">{lead.phone}</Labelled>
      <Labelled label="EMAIL ADDRESS">{lead.email}</Labelled>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-[#69768a]">SOURCE</p>
        <p className="flex items-center gap-[7px] text-[13px]">
          <SourceIcon aria-hidden="true" className="size-[17px] text-[#e5b44d]" />
          {lead.source}
        </p>
      </div>
      <div className="flex items-start justify-between gap-3 leading-[1.4]">
        <p className="text-[11px] font-medium text-[#69768a]">RECEIVED</p>
        <p className="text-[12px]">{receivedWhen(lead)}</p>
      </div>
      {digits ? (
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noreferrer"
          className="self-start rounded-[999px] border border-[#e3e8ef] bg-white px-6 py-[13px] text-[17px] font-medium hover:bg-[#f4f7fa]"
        >
          Open WhatsApp
        </a>
      ) : (
        lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="self-start rounded-[999px] border border-[#e3e8ef] bg-white px-6 py-[13px] text-[17px] font-medium hover:bg-[#f4f7fa]"
          >
            Send email
          </a>
        )
      )}
    </section>
  )
}

function BriefCard({ lead }: { lead: Lead }) {
  const updateLead = useAppStore((s) => s.updateLead)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const canStore = storageAvailable()

  async function attach(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setProblem(null)
    try {
      const path = await uploadLeadDocument(lead.id, file)
      const previous = lead.document?.path
      updateLead(lead.id, { document: { path, name: file.name, size: file.size, addedAt: new Date().toISOString() } })
      if (previous) await removeLeadDocument(previous)
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  async function open() {
    if (!lead.document) return
    const url = await signedLeadDocumentUrl(lead.document.path)
    if (url) window.open(url, '_blank', 'noopener')
    else setProblem('The document could not be opened. Check the connection and try again.')
  }

  async function detach() {
    if (!lead.document || !window.confirm(`Remove ${lead.document.name} from this lead?`)) return
    const path = lead.document.path
    updateLead(lead.id, { document: null })
    await removeLeadDocument(path)
  }

  return (
    <section className="flex flex-col gap-5 rounded-[18px] bg-white p-6 text-[#17263c]">
      <CardTitle title="Recruitment brief" />
      <Labelled label="POSITIONS REQUIRED">{lead.need || needLine(lead)}</Labelled>
      <div className="grid grid-cols-2 gap-4">
        <Labelled label="EXPERIENCE">{lead.experience}</Labelled>
        <Labelled label="TARGET START">{lead.targetStart}</Labelled>
      </div>
      <Labelled label="EMPLOYER REQUIREMENTS">{lead.requirements}</Labelled>

      <input ref={input} type="file" className="hidden" onChange={attach} />
      {lead.document ? (
        <div className="flex items-center gap-[9px] rounded-[10px] bg-[#f4f6f9] p-3">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-[#e5b44d]" />
          <button type="button" onClick={open} className="flex min-w-0 flex-1 flex-col gap-0.5 text-start leading-[1.4]">
            <span className="truncate text-[12px] font-medium hover:underline">{lead.document.name}</span>
            <span className="text-[11px] text-[#69768a]">
              {formatBytes(lead.document.size)}
              {lead.document.addedAt && ` · Added ${shortDate(lead.document.addedAt)}`}
            </span>
          </button>
          <button
            type="button"
            onClick={detach}
            aria-label={`Remove ${lead.document.name}`}
            className="rounded-[7px] p-1 text-[#69768a] hover:bg-white hover:text-[#b5473d]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy || !canStore}
          className="flex items-center gap-[9px] rounded-[10px] border border-dashed border-[#d0dcec] p-3 text-start text-[12px] text-[#69768a] hover:border-[#e5b44d] hover:text-[#17263c] disabled:opacity-60"
        >
          <Paperclip aria-hidden="true" className="size-5 shrink-0 text-[#e5b44d]" />
          {busy ? 'Uploading…' : canStore ? 'Attach the employer’s document' : 'Documents can be attached once the database is connected.'}
        </button>
      )}
      {problem && <p className="text-[12px] leading-[1.45] text-[#b5473d]">{problem}</p>}
    </section>
  )
}

function historyOf(lead: Lead, nameOf: (id: string) => string): HistoryItem[] {
  const items: HistoryItem[] = lead.activities
    .filter((a) => a.kind !== 'note')
    .map((a) => {
      const who = nameOf(a.authorId)
      if (a.kind === 'stage') {
        return { key: a.id, icon: Check, title: a.title, at: a.at, body: a.body, meta: `${who} · Stage updated`, tab: 'stages' }
      }
      if (a.kind === 'task') {
        return { key: a.id, icon: CircleCheck, title: a.title, at: a.at, body: a.body, meta: `${who} · Action completed`, tab: 'all' }
      }
      const spoken = a.channel === 'Call' || a.channel === 'Meeting'
      const how = [a.direction, a.channel === 'Call' ? 'call' : a.channel === 'Meeting' ? 'meeting' : a.channel].filter(Boolean).join(' ')
      const meta = [who, how, a.durationMinutes ? `${a.durationMinutes} min` : ''].filter(Boolean).join(' · ')
      return {
        key: a.id,
        icon: a.channel ? CHANNEL_ICON[a.channel] : MessageCircle,
        title: a.title || 'Contact',
        at: a.at,
        body: a.body,
        meta,
        tab: spoken ? 'calls' : 'messages',
      }
    })

  // The enquiry opens the history, at the time it was entered when that was the day it came.
  const receivedAt =
    lead.createdAt && toAstInput(lead.createdAt).slice(0, 10) === lead.receivedOn
      ? lead.createdAt
      : lead.receivedOn
        ? fromAstInput(`${lead.receivedOn}T00:00`)
        : lead.createdAt
  items.push({
    key: 'received',
    icon: SOURCE_ICON[lead.source],
    title: 'Enquiry received',
    at: receivedAt,
    body: lead.enquiry ? `“${lead.enquiry}”` : '',
    meta:
      lead.source === 'Manual entry'
        ? [lead.contactName, 'Recorded manually'].filter(Boolean).join(' · ')
        : [lead.contactName, `Inbound ${lead.source === 'Website form' ? 'website form' : lead.source}`].filter(Boolean).join(' · '),
    tab: lead.source === 'Manual entry' ? 'all' : 'messages',
  })
  return items
}

function HistoryCard({ lead, nameOf }: { lead: Lead; nameOf: (id: string) => string }) {
  const [tab, setTab] = useState<Tab>('all')
  const all = historyOf(lead, nameOf)
  const shown = tab === 'all' ? all : all.filter((item) => item.tab === tab)

  return (
    <section className="flex min-w-0 flex-col gap-6 rounded-[18px] bg-white p-6 text-[#17263c]">
      <CardTitle
        title="Contact history"
        right={
          <p className="text-[12px] leading-[1.4] whitespace-nowrap text-[#69768a]">
            {all.length} {all.length === 1 ? 'activity' : 'activities'}
          </p>
        }
      />
      <div role="tablist" className="flex flex-wrap gap-[22px] border-b border-[#e3e8ef] pb-3.5 text-[13px] leading-[1.4]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'font-semibold text-[#17263c]' : 'text-[#69768a] hover:text-[#17263c]'}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ol className="flex flex-col">
        {shown.map((item, index) => {
          const Icon = item.icon
          const last = index === shown.length - 1
          return (
            <li key={item.key} className="flex gap-3.5">
              <div className="flex w-[30px] shrink-0 flex-col items-center gap-2">
                <span
                  className={`flex size-[30px] shrink-0 items-center justify-center rounded-full ${
                    index === 0 ? 'bg-[#fbf4e5]' : 'bg-[#f4f6f9]'
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4 text-[#e5b44d]" />
                </span>
                {!last && <span aria-hidden="true" className="w-px flex-1 bg-[#e3e8ef]" />}
              </div>
              <div className={`flex min-w-0 flex-1 flex-col gap-[9px] leading-[1.4] ${last ? '' : 'pb-6'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-medium">{item.title}</p>
                  {item.at && (
                    <p className="shrink-0 text-[11px] text-[#69768a]">
                      {shortDate(item.at)} · {clock(item.at)}
                    </p>
                  )}
                </div>
                {item.body && <p className="text-[13px] whitespace-pre-line text-[#69768a]">{item.body}</p>}
                {item.meta && <p className="text-[11px] text-[#69768a]">{item.meta}</p>}
              </div>
            </li>
          )
        })}
        {shown.length === 0 && <li className="py-6 text-center text-[13px] text-[#69768a]">Nothing of this kind yet.</li>}
      </ol>

      <p className="border-t border-[#e3e8ef] pt-2 text-[11px] leading-[1.4] text-[#69768a]">
        All times in AST (UTC+3) · Complete activity history
      </p>
    </section>
  )
}

function NextActionCard({
  lead,
  now,
  ownerName,
  onReschedule,
}: {
  lead: Lead
  now: Date
  ownerName: string
  onReschedule: () => void
}) {
  const completeLeadAction = useAppStore((s) => s.completeLeadAction)
  const late = isOverdue(lead, now)
  const closed = lead.stage === 'Won' || lead.stage === 'Lost'
  const scheduled = Boolean(lead.nextFollowUpAt || lead.nextStep)

  return (
    <section className="flex flex-col gap-[18px] rounded-[18px] bg-[#fbf4e5] p-6 text-[#17263c]">
      <CardTitle
        title="Next action"
        right={
          late && (
            <span className="rounded-[6px] bg-[#fbefec] px-2 py-1 text-[11px] font-semibold leading-[1.4] text-[#b5473d]">OVERDUE</span>
          )
        }
      />
      {scheduled ? (
        <>
          <p className="text-[17px] font-medium leading-[1.4]">
            {lead.nextStep || (isContacted(lead) ? 'Follow up' : 'First response')}
          </p>
          {lead.nextFollowUpAt && (
            <p className={`text-[13px] leading-[1.4] ${late ? 'text-[#b5473d]' : 'text-[#69768a]'}`}>
              Due {longDate(lead.nextFollowUpAt)} · {clock(lead.nextFollowUpAt)} AST
            </p>
          )}
          {lead.nextStepDetail && <p className="text-[13px] leading-[1.4] whitespace-pre-line text-[#69768a]">{lead.nextStepDetail}</p>}
        </>
      ) : (
        <p className="text-[13px] leading-[1.4] text-[#69768a]">
          {closed
            ? lead.stage === 'Won'
              ? 'Won. Hand the job order to the placement team.'
              : 'This enquiry is closed.'
            : 'Nothing is scheduled for this lead. Give it a clear next step.'}
        </p>
      )}

      <div className="flex items-center gap-2.5">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#e9edf3] text-[11px] font-semibold">
          {ownerName ? initials(ownerName) : '—'}
        </span>
        <div className="flex flex-col gap-0.5 leading-[1.4]">
          <p className="text-[13px] font-medium">{ownerName || 'Unassigned'}</p>
          <p className="text-[11px] text-[#69768a]">{ownerName ? 'Lead owner' : 'Choose an owner in Edit lead'}</p>
        </div>
      </div>

      {scheduled ? (
        <>
          <GoldButton onClick={() => completeLeadAction(lead.id)} className="self-start">
            Mark action complete
          </GoldButton>
          <button type="button" onClick={onReschedule} className="self-start text-[13px] font-medium leading-[1.4] text-[#82601d] hover:underline">
            Reschedule follow-up →
          </button>
        </>
      ) : (
        <GoldButton onClick={onReschedule} className="self-start">
          Schedule follow-up
        </GoldButton>
      )}
    </section>
  )
}

function NotesCard({ lead, nameOf, canDelete }: { lead: Lead; nameOf: (id: string) => string; canDelete: boolean }) {
  const addLeadNote = useAppStore((s) => s.addLeadNote)
  const deleteLeadNote = useAppStore((s) => s.deleteLeadNote)
  const [text, setText] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  const notes = lead.activities.filter((a) => a.kind === 'note')

  function save() {
    if (!text.trim()) return
    addLeadNote(lead.id, text)
    setText('')
  }

  const stamp = (note: LeadActivity) => `${nameOf(note.authorId)} · ${longDate(note.at)}, ${clock(note.at)}`

  return (
    <section className="flex flex-col gap-5 rounded-[18px] bg-white p-6 text-[#17263c]">
      <CardTitle
        title="Internal notes"
        right={
          <button type="button" onClick={() => box.current?.focus()} className="text-[13px] font-medium leading-[1.4] whitespace-nowrap text-[#82601d] hover:underline">
            Add note +
          </button>
        }
      />
      {lead.notes && (
        <div className="flex flex-col gap-3 rounded-[12px] bg-[#f4f6f9] p-4 leading-[1.4]">
          <p className="text-[13px] whitespace-pre-line">{lead.notes}</p>
          <p className="text-[11px] text-[#69768a]">Kept on the lead record</p>
        </div>
      )}
      {notes.map((note) => (
        <div key={note.id} className="group flex flex-col gap-3 rounded-[12px] bg-[#f4f6f9] p-4 leading-[1.4]">
          <p className="text-[13px] whitespace-pre-line">{note.body}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[#69768a]">{stamp(note)}</p>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this note?')) deleteLeadNote(lead.id, note.id)
                }}
                aria-label="Delete note"
                className="rounded-[6px] p-0.5 text-[#69768a] opacity-0 group-hover:opacity-100 hover:text-[#b5473d] focus:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
      <Field label="ADD A NOTE" hint="Only visible to your recruitment team">
        <TextArea
          ref={box}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
          }}
          placeholder="Write a note for the team…"
          className="min-h-[52px] py-3.5"
          rows={1}
        />
      </Field>
      {text.trim() && (
        <LightButton onClick={save} className="self-start py-2.5 text-[15px]">
          Save note
        </LightButton>
      )}
    </section>
  )
}

/* ------------------------------------------------------------ dialogs -- */

function LogContactDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const logLeadContact = useAppStore((s) => s.logLeadContact)
  const nowInput = toAstInput(new Date().toISOString())
  const [channel, setChannel] = useState<LeadChannel>(lead.source === 'Email' ? 'Email' : 'WhatsApp')
  const [direction, setDirection] = useState<'Outbound' | 'Inbound'>('Outbound')
  const [date, setDate] = useState(nowInput.slice(0, 10))
  const [time, setTime] = useState(nowInput.slice(11, 16))
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [minutes, setMinutes] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const spoken = channel === 'Call' || channel === 'Meeting'

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return setProblem('Say in a few words what happened: “Requirements confirmed”.')
    if (!date || !time) return setProblem('Say when it happened.')
    logLeadContact(lead.id, {
      channel,
      direction,
      title: title.trim(),
      body: body.trim(),
      durationMinutes: spoken ? Math.max(0, Math.round(Number(minutes) || 0)) : 0,
      at: fromAstInput(`${date}T${time}`),
    })
    onClose()
  }

  return (
    <LeadDialog title="Log contact" note={`A message, call or meeting with ${lead.contactName || lead.employerName}.`} onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium tracking-[0.08em] text-[#69768a]">CHANNEL</span>
          <div role="radiogroup" aria-label="Channel" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEAD_CHANNELS.map((option) => (
              <ChoiceCard key={option} label={option} selected={channel === option} onSelect={() => setChannel(option)} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium tracking-[0.08em] text-[#69768a]">DIRECTION</span>
          <div role="radiogroup" aria-label="Direction" className="flex gap-2">
            <ChoiceCard label="We reached them" selected={direction === 'Outbound'} onSelect={() => setDirection('Outbound')} />
            <ChoiceCard label="They reached us" selected={direction === 'Inbound'} onSelect={() => setDirection('Inbound')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="DATE">
            <PickerBox type="date" value={date} onChange={(e) => setDate(e.target.value)} icon={<CalendarDays className="size-[18px] text-[#e5b44d]" />} />
          </Field>
          <Field label="TIME (AST)">
            <PickerBox type="time" value={time} onChange={(e) => setTime(e.target.value)} icon={<Clock className="size-[18px] text-[#69768a]" />} />
          </Field>
        </div>
        <Field label="WHAT HAPPENED *">
          <TextBox value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Requirements confirmed" autoFocus />
        </Field>
        <Field label="DETAILS">
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What was said, agreed or asked for…" />
        </Field>
        {spoken && (
          <Field label="DURATION (MINUTES)">
            <TextBox type="number" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="18" />
          </Field>
        )}
        {problem && <p className="text-[12px] text-[#b5473d]">{problem}</p>}
        <div className="flex justify-end gap-3 border-t border-[#e3e8ef] pt-4">
          <LightButton onClick={onClose}>Cancel</LightButton>
          <GoldButton type="submit">Log contact</GoldButton>
        </div>
      </form>
    </LeadDialog>
  )
}

function FollowUpDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const updateLead = useAppStore((s) => s.updateLead)
  const held = toAstInput(lead.nextFollowUpAt)
  const [date, setDate] = useState(held.slice(0, 10))
  const [time, setTime] = useState(held.slice(11, 16) || '09:00')
  const [step, setStep] = useState(lead.nextStep)
  const [detail, setDetail] = useState(lead.nextStepDetail)
  const [problem, setProblem] = useState<string | null>(null)

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!date) return setProblem('Choose the day to follow up.')
    updateLead(lead.id, {
      nextFollowUpAt: fromAstInput(`${date}T${time || '09:00'}`),
      nextStep: step.trim(),
      nextStepDetail: detail.trim(),
    })
    onClose()
  }

  return (
    <LeadDialog title={lead.nextFollowUpAt ? 'Reschedule follow-up' : 'Schedule follow-up'} note="Arabia Standard Time (UTC+3)." onClose={onClose}>
      <form onSubmit={save} className="flex flex-col gap-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="DATE *">
            <PickerBox type="date" value={date} onChange={(e) => setDate(e.target.value)} icon={<CalendarDays className="size-[18px] text-[#e5b44d]" />} />
          </Field>
          <Field label="TIME">
            <PickerBox type="time" value={time} onChange={(e) => setTime(e.target.value)} icon={<Clock className="size-[18px] text-[#69768a]" />} />
          </Field>
        </div>
        <Field label="NEXT STEP">
          <TextBox value={step} onChange={(e) => setStep(e.target.value)} placeholder="Send shortlist & fee proposal" autoFocus />
        </Field>
        <Field label="DETAILS">
          <TextArea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What has to happen, and anything to check first…" />
        </Field>
        {problem && <p className="text-[12px] text-[#b5473d]">{problem}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e8ef] pt-4">
          {lead.nextFollowUpAt ? (
            <button
              type="button"
              onClick={() => {
                updateLead(lead.id, { nextFollowUpAt: '', nextStep: '', nextStepDetail: '' })
                onClose()
              }}
              className="text-[13px] font-medium text-[#b5473d] hover:underline"
            >
              Clear follow-up
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <LightButton onClick={onClose}>Cancel</LightButton>
            <GoldButton type="submit">Save</GoldButton>
          </div>
        </div>
      </form>
    </LeadDialog>
  )
}
