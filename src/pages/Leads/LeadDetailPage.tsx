/*
  One lead: who they are, what they want, everything said so far, and what
  happens next.

  Built from the "Selected lead" frame in the design file -- the stage
  tracker, the three columns of contact, brief, history, next action and
  notes -- in the dashboard's own panel and type sizes. Everything on it is
  written by hand: Log contact records a message or call (and with it the last
  contact), Update stage moves the lead and writes the move into the history,
  Mark action complete files the next action away, and notes stay internal.

  Every time is read on the Riyadh clock.
*/

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCurrentUser } from '../../lib/useCurrentUser'
import Modal from '../../components/Modal'
import { Field, PrimaryButton, SecondaryButton, TextArea, TextInput } from '../../components/form'
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
import { ChoiceCard, DataContext, FilterTab, PickerInput } from './leadUi'
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
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-ink">This lead no longer exists.</p>
        <Link to="/leads" className="text-xs text-accent-text hover:text-accent">
          Back to leads
        </Link>
      </div>
    )
  }

  const nameOf = (staffId: string) => staff.find((m) => m.id === staffId)?.name.en ?? 'Somebody'
  const summary = [lead.industry, [lead.city, lead.country].filter(Boolean).join(', '), needLine(lead)].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-4 p-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-2">
        <Link to="/leads" className="hover:text-ink">
          Leads
        </Link>
        <ChevronRight aria-hidden="true" className="size-3 rtl:rotate-180" />
        <span className="truncate text-ink">{lead.employerName}</span>
        <span className="text-ink-3">· {leadRef(lead)}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-panel bg-accent-soft text-accent-text">
            <Building2 aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-ink">{lead.employerName}</h1>
            {summary && <p className="mt-1 text-[12.5px] text-ink-3">{summary}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton onClick={() => navigate(`/leads/${lead.id}/edit`)} className="flex items-center gap-1.5">
            <Pencil className="size-3.5" /> Edit lead
          </SecondaryButton>
          <PrimaryButton onClick={() => setDialog('contact')} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> Log contact
          </PrimaryButton>
        </div>
      </div>

      <ProcessCard lead={lead} now={now} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <ContactCard lead={lead} />
          <BriefCard lead={lead} />
        </div>
        <HistoryCard lead={lead} nameOf={nameOf} />
        <div className="flex flex-col gap-4 lg:col-span-2 lg:grid lg:grid-cols-2 xl:col-span-1 xl:flex">
          <NextActionCard
            lead={lead}
            now={now}
            ownerName={lead.ownerId ? nameOf(lead.ownerId) : ''}
            onReschedule={() => setDialog('follow-up')}
          />
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
    <section className="panel">
      <header className="panel-header items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="panel-title">Current process</h2>
          <p className="text-[11px] text-ink-3">
            {since
              ? `${lead.stage} on ${shortDate(since)} · ${days === 0 ? 'today' : `${days} ${days === 1 ? 'day' : 'days'} in stage`}`
              : lead.stage}
          </p>
        </div>
        <div ref={panel} className="relative">
          <button
            type="button"
            onClick={() => {
              setStage(lead.stage)
              setNote('')
              setOpen((v) => !v)
            }}
            aria-expanded={open}
            className="btn btn-ghost h-7 px-2 text-accent-text"
          >
            Update stage <ChevronDown className="size-3.5" />
          </button>
          {open && (
            <div className="absolute end-0 top-8 z-20 flex w-[260px] flex-col gap-2 rounded-panel border border-line bg-surface p-3 shadow-pop">
              <div role="radiogroup" aria-label="Stage" className="flex flex-col gap-1.5">
                {LEAD_STAGES.map((option) => (
                  <ChoiceCard key={option} label={option} selected={stage === option} onSelect={() => setStage(option)} />
                ))}
              </div>
              <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What moved it? (optional)" />
              <PrimaryButton
                disabled={stage === lead.stage}
                onClick={() => {
                  setLeadStage(lead.id, stage, note)
                  setOpen(false)
                }}
              >
                Move to {stage}
              </PrimaryButton>
            </div>
          )}
        </div>
      </header>

      <ol className="flex flex-wrap items-center gap-3 p-4">
        {LEAD_PATH.map((step, index) => {
          const done = !lost && index < current
          const here = !lost && index === current
          const last = index === LEAD_PATH.length - 1
          return (
            <li key={step} className="flex min-w-[130px] flex-1 items-center gap-2">
              <span
                className={`num flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done || here ? 'bg-accent text-accent-ink' : 'border border-line-strong bg-raised text-ink-3'
                }`}
              >
                {done ? <Check aria-label="Done" className="size-3.5" strokeWidth={2.5} /> : index + 1}
              </span>
              <span className={`text-[12px] whitespace-nowrap ${here ? 'font-semibold text-accent-text' : done ? 'text-ink' : 'text-ink-3'}`}>
                {step}
              </span>
              {!last && <span aria-hidden="true" className={`h-px min-w-3 flex-1 ${done ? 'bg-accent-line' : 'bg-line'}`} />}
            </li>
          )
        })}
        {lost && <li className="chip chip-neg">Lost</li>}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------ the cards -- */

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <header className="panel-header items-center">
      <h2 className="panel-title">{title}</h2>
      {right}
    </header>
  )
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] text-ink-3">{label}</p>
      <div className="mt-0.5 text-xs break-words text-ink">{children || <span className="text-ink-3">—</span>}</div>
    </div>
  )
}

function ContactCard({ lead }: { lead: Lead }) {
  const contacted = isContacted(lead)
  const SourceIcon = SOURCE_ICON[lead.source]
  const digits = lead.phone.replace(/[^\d]/g, '')

  return (
    <section className="panel">
      <CardHeader title="Contact information" />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">{lead.contactName || '—'}</p>
          <p className="mt-0.5 text-[11px] text-ink-3">{[lead.contactRole, 'Primary contact'].filter(Boolean).join(' · ')}</p>
          <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${contacted ? 'text-pos' : 'text-neg'}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${contacted ? 'bg-pos' : 'bg-neg'}`} />
            {contacted ? 'Contacted' : 'Not contacted'}
          </p>
        </div>
        <hr className="border-line" />
        <Labelled label="Phone / WhatsApp">{lead.phone}</Labelled>
        <Labelled label="Email address">{lead.email}</Labelled>
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="text-[10.5px] text-ink-3">Source</p>
          <p className="flex items-center gap-1.5 text-ink">
            <SourceIcon aria-hidden="true" className="size-3.5 text-accent-text" />
            {lead.source}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="text-[10.5px] text-ink-3">Received</p>
          <p className="text-ink">{receivedWhen(lead)}</p>
        </div>
        {digits ? (
          <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="btn btn-secondary w-full">
            <MessageCircle className="size-3.5" /> Open WhatsApp
          </a>
        ) : (
          lead.email && (
            <a href={`mailto:${lead.email}`} className="btn btn-secondary w-full">
              <Mail className="size-3.5" /> Send email
            </a>
          )
        )}
      </div>
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
    <section className="panel">
      <CardHeader title="Recruitment brief" />
      <div className="flex flex-col gap-3 p-4">
        <Labelled label="Positions required">{lead.need || needLine(lead)}</Labelled>
        <div className="grid grid-cols-2 gap-3">
          <Labelled label="Experience">{lead.experience}</Labelled>
          <Labelled label="Target start">{lead.targetStart}</Labelled>
        </div>
        <Labelled label="Employer requirements">{lead.requirements}</Labelled>

        <input ref={input} type="file" className="hidden" onChange={attach} />
        {lead.document ? (
          <div className="flex items-center gap-2 rounded-control border border-line bg-sunken p-2.5">
            <FileText aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
            <button type="button" onClick={open} className="min-w-0 flex-1 text-start">
              <span className="block truncate text-[11.5px] font-medium text-ink hover:underline">{lead.document.name}</span>
              <span className="block text-[10.5px] text-ink-3">
                {formatBytes(lead.document.size)}
                {lead.document.addedAt && ` · Added ${shortDate(lead.document.addedAt)}`}
              </span>
            </button>
            <button type="button" onClick={detach} aria-label={`Remove ${lead.document.name}`} className="text-ink-3 hover:text-neg">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy || !canStore}
            className="flex items-center gap-2 rounded-control border border-dashed border-line-strong p-2.5 text-start text-[11px] text-ink-3 hover:border-accent-line hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Paperclip aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
            {busy ? 'Uploading…' : canStore ? 'Attach the employer’s document' : 'Documents can be attached once the database is connected.'}
          </button>
        )}
        {problem && <p className="text-[11px] font-medium text-neg">{problem}</p>}
      </div>
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
    <section className="panel min-w-0">
      <CardHeader
        title="Contact history"
        right={
          <p className="text-[11px] whitespace-nowrap text-ink-3">
            {all.length} {all.length === 1 ? 'activity' : 'activities'}
          </p>
        }
      />
      <div className="flex flex-wrap gap-1 border-b border-line px-3 py-2">
        {TABS.map((t) => (
          <FilterTab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </FilterTab>
        ))}
      </div>

      <ol className="flex flex-col p-4">
        {shown.map((item, index) => {
          const Icon = item.icon
          const last = index === shown.length - 1
          return (
            <li key={item.key} className="flex gap-3">
              <div className="flex w-7 shrink-0 flex-col items-center gap-1.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    index === 0 ? 'bg-accent-soft text-accent-text' : 'border border-line bg-raised text-ink-3'
                  }`}
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                </span>
                {!last && <span aria-hidden="true" className="w-px flex-1 bg-line" />}
              </div>
              <div className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium text-ink">{item.title}</p>
                  {item.at && (
                    <p className="shrink-0 text-[10.5px] text-ink-3">
                      {shortDate(item.at)} · {clock(item.at)}
                    </p>
                  )}
                </div>
                {item.body && <p className="mt-1 text-[11.5px] whitespace-pre-line text-ink-2">{item.body}</p>}
                {item.meta && <p className="mt-1 text-[10.5px] text-ink-3">{item.meta}</p>}
              </div>
            </li>
          )
        })}
        {shown.length === 0 && <li className="py-6 text-center text-[11px] text-ink-3">Nothing of this kind yet.</li>}
      </ol>

      <p className="border-t border-line px-4 py-2 text-[10.5px] text-ink-3">All times in AST (UTC+3) · Complete activity history</p>
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
    <section className="panel relative overflow-hidden border-accent-line">
      <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-accent" />
      <CardHeader title="Next action" right={late && <span className="chip chip-neg">Overdue</span>} />
      <div className="flex flex-col gap-3 p-4">
        {scheduled ? (
          <div>
            <p className="text-sm font-semibold text-ink">{lead.nextStep || (isContacted(lead) ? 'Follow up' : 'First response')}</p>
            {lead.nextFollowUpAt && (
              <p className={`mt-1 text-[11.5px] ${late ? 'font-medium text-neg' : 'text-ink-2'}`}>
                Due {longDate(lead.nextFollowUpAt)} · {clock(lead.nextFollowUpAt)} AST
              </p>
            )}
            {lead.nextStepDetail && <p className="mt-1.5 text-[11.5px] whitespace-pre-line text-ink-3">{lead.nextStepDetail}</p>}
          </div>
        ) : (
          <p className="text-[11.5px] text-ink-3">
            {closed
              ? lead.stage === 'Won'
                ? 'Won. Hand the job order to the placement team.'
                : 'This enquiry is closed.'
              : 'Nothing is scheduled for this lead. Give it a clear next step.'}
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-[10px] font-semibold text-ink-2">
            {ownerName ? initials(ownerName) : '—'}
          </span>
          <div>
            <p className="text-xs font-medium text-ink">{ownerName || 'Unassigned'}</p>
            <p className="text-[10.5px] text-ink-3">{ownerName ? 'Lead owner' : 'Choose an owner in Edit lead'}</p>
          </div>
        </div>

        {scheduled ? (
          <div className="flex flex-wrap items-center gap-2">
            <PrimaryButton onClick={() => completeLeadAction(lead.id)} className="flex items-center gap-1.5">
              <Check className="size-3.5" /> Mark action complete
            </PrimaryButton>
            <SecondaryButton onClick={onReschedule}>Reschedule</SecondaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={onReschedule} className="self-start">
            Schedule follow-up
          </PrimaryButton>
        )}
      </div>
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
    <section className="panel">
      <CardHeader
        title="Internal notes"
        right={
          <button type="button" onClick={() => box.current?.focus()} className="btn btn-ghost h-7 px-2 text-accent-text">
            <Plus className="size-3.5" /> Add note
          </button>
        }
      />
      <div className="flex flex-col gap-2 p-4">
        {lead.notes && (
          <div className="rounded-control border border-line bg-sunken p-2.5">
            <p className="text-[11.5px] whitespace-pre-line text-ink">{lead.notes}</p>
            <p className="mt-1.5 text-[10.5px] text-ink-3">Kept on the lead record</p>
          </div>
        )}
        {notes.map((note) => (
          <div key={note.id} className="group rounded-control border border-line bg-sunken p-2.5">
            <p className="text-[11.5px] whitespace-pre-line text-ink">{note.body}</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-[10.5px] text-ink-3">{stamp(note)}</p>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this note?')) deleteLeadNote(lead.id, note.id)
                  }}
                  aria-label="Delete note"
                  className="text-ink-3 opacity-0 group-hover:opacity-100 hover:text-neg focus:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        <label className="mt-1 block">
          <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">Add a note</span>
          <textarea
            ref={box}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
            }}
            placeholder="Write a note for the team…"
            className="field"
          />
          <span className="mt-1 block text-[11px] text-ink-3">Only visible to your recruitment team</span>
        </label>
        {text.trim() && (
          <SecondaryButton onClick={save} className="self-start">
            Save note
          </SecondaryButton>
        )}
      </div>
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
    <Modal title={`Log contact · ${lead.contactName || lead.employerName}`} onClose={onClose} width="max-w-lg">
      <form onSubmit={save}>
        <div className="mb-3">
          <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">Channel</span>
          <div role="radiogroup" aria-label="Channel" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEAD_CHANNELS.map((option) => (
              <ChoiceCard key={option} label={option} selected={channel === option} onSelect={() => setChannel(option)} />
            ))}
          </div>
        </div>
        <div className="mb-3">
          <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">Direction</span>
          <div role="radiogroup" aria-label="Direction" className="flex gap-2">
            <ChoiceCard label="We reached them" selected={direction === 'Outbound'} onSelect={() => setDirection('Outbound')} />
            <ChoiceCard label="They reached us" selected={direction === 'Inbound'} onSelect={() => setDirection('Inbound')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Date">
            <PickerInput type="date" value={date} onChange={(e) => setDate(e.target.value)} icon={<CalendarDays className="size-3.5" />} />
          </Field>
          <Field label="Time (AST)">
            <PickerInput type="time" value={time} onChange={(e) => setTime(e.target.value)} icon={<Clock className="size-3.5" />} />
          </Field>
        </div>
        <Field label="What happened *">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Requirements confirmed" autoFocus />
        </Field>
        <Field label="Details">
          <TextArea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What was said, agreed or asked for…" />
        </Field>
        {spoken && (
          <Field label="Duration (minutes)">
            <TextInput type="number" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="18" />
          </Field>
        )}
        {problem && <p className="mt-1 text-[11px] font-medium text-neg">{problem}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Log contact</PrimaryButton>
        </div>
      </form>
    </Modal>
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
    <Modal title={lead.nextFollowUpAt ? 'Reschedule follow-up' : 'Schedule follow-up'} onClose={onClose}>
      <form onSubmit={save}>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Date *">
            <PickerInput type="date" value={date} onChange={(e) => setDate(e.target.value)} icon={<CalendarDays className="size-3.5" />} />
          </Field>
          <Field label="Time (AST)">
            <PickerInput type="time" value={time} onChange={(e) => setTime(e.target.value)} icon={<Clock className="size-3.5" />} />
          </Field>
        </div>
        <Field label="Next step">
          <TextInput value={step} onChange={(e) => setStep(e.target.value)} placeholder="Send shortlist & fee proposal" autoFocus />
        </Field>
        <Field label="Details">
          <TextArea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What has to happen, and anything to check first…" />
        </Field>
        {problem && <p className="mt-1 text-[11px] font-medium text-neg">{problem}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {lead.nextFollowUpAt ? (
            <button
              type="button"
              onClick={() => {
                updateLead(lead.id, { nextFollowUpAt: '', nextStep: '', nextStepDetail: '' })
                onClose()
              }}
              className="btn btn-danger"
            >
              Clear follow-up
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save</PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}
