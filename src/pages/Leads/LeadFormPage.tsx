/*
  Add new lead, and the same page for bringing one up to date.

  Built from the "Add new lead" frame in the design file -- its two columns,
  its sections and its choices -- in the dashboard's own field and panel
  sizes. Adding asks only what the frame asks: who, how to reach them, where
  it came from, what they want, and where it stands, because an enquiry is
  worth recording the moment it lands. Editing adds the rest of the record the
  lead page shows: the contact's role, the industry and place, the brief in
  its parts, the owner, and the next step in words.

  Follow-up times are typed on the Riyadh clock, which is what every lead page
  shows.
*/

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Clock } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCurrentUser } from '../../lib/useCurrentUser'
import PageHeader from '../../components/PageHeader'
import { Field, PrimaryButton, SecondaryButton, SelectInput, TextArea, TextInput } from '../../components/form'
import { LEAD_SOURCES, LEAD_STAGES, astToday, fromAstInput, leadRef, toAstInput } from '../../lib/leads'
import { ChoiceCard, DataContext, PickerInput, SectionTitle } from './leadUi'
import type { Lead } from '../../types'

type Draft = Omit<Lead, 'id' | 'refNo' | 'createdAt' | 'activities'>
type Problems = Partial<Record<'employerName' | 'contactName' | 'contact' | 'enquiry' | 'followUp', string>>

function emptyDraft(ownerId: string): Draft {
  return {
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
    source: 'Manual entry',
    stage: 'New enquiry',
    stageChangedAt: '',
    contacted: false,
    ownerId,
    receivedOn: astToday(),
    lastContactAt: '',
    lastContactChannel: '',
    nextFollowUpAt: '',
    nextStep: '',
    nextStepDetail: '',
    notes: '',
    document: null,
  }
}

/** A field's red edge when it is the one at fault. */
const faulty = (problem?: string) => (problem ? 'border-neg!' : '')

export default function LeadFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lead = useAppStore((s) => (id ? s.leads.find((l) => l.id === id) ?? null : null))
  const staff = useAppStore((s) => s.staff)
  const addLead = useAppStore((s) => s.addLead)
  const updateLead = useAppStore((s) => s.updateLead)
  const deleteLead = useAppStore((s) => s.deleteLead)
  const setLeadStage = useAppStore((s) => s.setLeadStage)
  const { member, canRemove } = useCurrentUser()
  const editing = Boolean(id)

  const [draft, setDraft] = useState<Draft>(() => {
    if (!lead) return emptyDraft(member?.id ?? '')
    const { id: _id, refNo: _ref, createdAt: _created, activities: _activities, ...rest } = lead
    return rest
  })
  const initialFollowUp = toAstInput(lead?.nextFollowUpAt ?? '')
  const [followDate, setFollowDate] = useState(initialFollowUp.slice(0, 10))
  const [followTime, setFollowTime] = useState(initialFollowUp.slice(11, 16))
  const [problems, setProblems] = useState<Problems>({})

  if (editing && !lead) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-ink">This lead no longer exists.</p>
        <Link to="/leads" className="text-xs text-accent-text hover:text-accent">
          Back to leads
        </Link>
      </div>
    )
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setProblems((p) => ({ ...p, [key === 'email' || key === 'phone' ? 'contact' : key]: undefined }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found: Problems = {}
    if (!draft.employerName.trim()) found.employerName = 'Enter the company or employer.'
    if (!draft.contactName.trim()) found.contactName = 'Enter who made the enquiry.'
    if (!draft.email.trim() && !draft.phone.trim()) found.contact = 'Provide at least one contact method: email or phone / WhatsApp.'
    if (!draft.enquiry.trim() && !draft.need.trim()) found.enquiry = 'Describe what the employer is asking for.'
    if (followTime && !followDate) found.followUp = 'Choose a date for the follow-up, or clear the time.'
    setProblems(found)
    if (Object.keys(found).length > 0) return

    // A date with no time is taken as the start of the working day.
    const nextFollowUpAt = followDate ? fromAstInput(`${followDate}T${followTime || '09:00'}`) : ''
    const cleaned: Draft = {
      ...draft,
      employerName: draft.employerName.trim(),
      contactName: draft.contactName.trim(),
      contactRole: draft.contactRole.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      industry: draft.industry.trim(),
      city: draft.city.trim(),
      country: draft.country.trim(),
      need: draft.need.trim(),
      enquiry: draft.enquiry.trim(),
      experience: draft.experience.trim(),
      targetStart: draft.targetStart.trim(),
      requirements: draft.requirements.trim(),
      nextStep: draft.nextStep.trim(),
      nextStepDetail: draft.nextStepDetail.trim(),
      nextFollowUpAt,
    }

    if (lead) {
      // A stage changed here is written into the history like any other move.
      const { stage, ...rest } = cleaned
      updateLead(lead.id, rest)
      if (stage !== lead.stage) setLeadStage(lead.id, stage)
      navigate(`/leads/${lead.id}`)
    } else {
      const created = addLead(cleaned)
      navigate(`/leads/${created}`)
    }
  }

  function handleDelete() {
    if (!lead) return
    if (!window.confirm(`Delete the enquiry from ${lead.employerName} and its whole history? This cannot be undone.`)) return
    deleteLead(lead.id)
    navigate('/leads')
  }

  const owners = staff.filter((m) => m.role !== 'none' && (m.status === 'Active' || m.id === draft.ownerId))

  return (
    <div className="flex flex-col gap-4 p-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-2">
        <Link to="/leads" className="hover:text-ink">
          Leads
        </Link>
        <ChevronRight aria-hidden="true" className="size-3 rtl:rotate-180" />
        {lead && (
          <>
            <Link to={`/leads/${lead.id}`} className="hover:text-ink">
              {lead.employerName}
            </Link>
            <ChevronRight aria-hidden="true" className="size-3 rtl:rotate-180" />
          </>
        )}
        <span className="text-accent-text">{lead ? 'Edit lead' : 'Add new lead'}</span>
      </nav>

      <PageHeader
        title={lead ? 'Edit lead' : 'Add new lead'}
        subtitle={
          lead
            ? `${leadRef(lead)} · Bring the enquiry, its brief and its next step up to date.`
            : 'Capture an employer enquiry and give it a clear next step.'
        }
      />

      <form onSubmit={handleSubmit} noValidate className="panel overflow-hidden">
        <header className="panel-header items-center">
          <h2 className="panel-title">Employer recruitment enquiry</h2>
          <p className="text-[11px] text-ink-3">* Required fields · All other fields are optional</p>
        </header>

        <div className="flex flex-col gap-6 p-4 xl:flex-row">
          {/* left: the enquiry -------------------------------------------- */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <section>
              <SectionTitle title="Company & contact details" />
              <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                <Field label="Company / employer *" error={problems.employerName}>
                  <TextInput
                    value={draft.employerName}
                    onChange={(e) => set('employerName', e.target.value)}
                    placeholder="Enter company name"
                    className={faulty(problems.employerName)}
                    autoFocus={!editing}
                  />
                </Field>
                <Field label="Contact name *" error={problems.contactName}>
                  <TextInput
                    value={draft.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    placeholder="Enter full name"
                    className={faulty(problems.contactName)}
                  />
                </Field>
                <Field label="Email address">
                  <TextInput
                    type="email"
                    value={draft.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="name@company.com"
                    className={faulty(problems.contact)}
                  />
                </Field>
                <Field label="Phone / WhatsApp">
                  <TextInput
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+966 5X XXX XXXX"
                    className={faulty(problems.contact)}
                  />
                </Field>
                {editing && (
                  <>
                    <Field label="Contact role">
                      <TextInput value={draft.contactRole} onChange={(e) => set('contactRole', e.target.value)} placeholder="HR Director" />
                    </Field>
                    <Field label="Industry">
                      <TextInput value={draft.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Healthcare" />
                    </Field>
                    <Field label="City">
                      <TextInput value={draft.city} onChange={(e) => set('city', e.target.value)} placeholder="Riyadh" />
                    </Field>
                    <Field label="Country">
                      <TextInput value={draft.country} onChange={(e) => set('country', e.target.value)} placeholder="Saudi Arabia" />
                    </Field>
                  </>
                )}
              </div>
              <p className={`text-[11px] ${problems.contact ? 'font-medium text-neg' : 'text-ink-3'}`}>
                {problems.contact ?? 'Provide at least one contact method: email or phone / WhatsApp. Include the country code.'}
              </p>
            </section>

            <hr className="border-line" />

            <section>
              <SectionTitle title="Lead source *" note="Where did this enquiry originate?" />
              <div role="radiogroup" aria-label="Lead source" className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {LEAD_SOURCES.map((source) => (
                  <ChoiceCard key={source} label={source} selected={draft.source === source} onSelect={() => set('source', source)} />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-3">
                Source is recorded manually. Selecting a channel does not connect or import messages.
              </p>
            </section>

            <hr className="border-line" />

            <section>
              <SectionTitle title="Recruitment requirements" />
              {editing && (
                <>
                  <Field label="Positions required" hint="Short, as the register shows it: “24 ICU & ER nurses”.">
                    <TextInput value={draft.need} onChange={(e) => set('need', e.target.value)} placeholder="24 registered nurses — ICU & ER" />
                  </Field>
                  <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                    <Field label="Experience">
                      <TextInput value={draft.experience} onChange={(e) => set('experience', e.target.value)} placeholder="3+ years" />
                    </Field>
                    <Field label="Target start">
                      <TextInput value={draft.targetStart} onChange={(e) => set('targetStart', e.target.value)} placeholder="Jan 2027" />
                    </Field>
                  </div>
                  <Field label="Employer requirements">
                    <TextArea
                      rows={3}
                      value={draft.requirements}
                      onChange={(e) => set('requirements', e.target.value)}
                      placeholder="Licences, eligibility, experience the employer insists on…"
                    />
                  </Field>
                </>
              )}
              <Field label={editing ? 'Enquiry as received' : 'Enquiry / requirements *'} error={problems.enquiry}>
                <TextArea
                  rows={3}
                  value={draft.enquiry}
                  onChange={(e) => set('enquiry', e.target.value)}
                  placeholder="Describe the roles, number of workers, work location and expected start date…"
                  className={faulty(problems.enquiry)}
                />
              </Field>
              {!editing && (
                <Field label="Internal notes · optional" hint="Internal only. Notes are not sent to the employer.">
                  <TextArea
                    rows={3}
                    value={draft.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Add context, preferences or details for the team…"
                  />
                </Field>
              )}
            </section>
          </div>

          <div aria-hidden="true" className="hidden w-px shrink-0 self-stretch bg-line xl:block" />

          {/* right: ownership and the next step ---------------------------- */}
          <div className="flex w-full shrink-0 flex-col gap-4 xl:w-[340px]">
            <section>
              <SectionTitle title="Ownership & progress" note="Set responsibility and the starting point for this lead." />
              <div className="mb-3">
                <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">Contact status *</span>
                <div role="radiogroup" aria-label="Contact status" className="flex gap-2">
                  <ChoiceCard label="Not contacted" selected={!draft.contacted} onSelect={() => set('contacted', false)} />
                  <ChoiceCard label="Contacted" selected={draft.contacted} onSelect={() => set('contacted', true)} />
                </div>
                <span className="mt-1 block text-[11px] text-ink-3">
                  {draft.contacted ? 'Log each conversation from the lead page to keep its history.' : 'No outreach recorded yet.'}
                </span>
              </div>
              <Field label="Current process stage *" hint="New enquiries stay at this stage until the first contact is made.">
                <SelectInput value={draft.stage} onChange={(e) => set('stage', e.target.value as Draft['stage'])}>
                  {LEAD_STAGES.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </SelectInput>
              </Field>
              {editing && (
                <div className="grid grid-cols-2 gap-x-3">
                  <Field label="Lead owner">
                    <SelectInput value={draft.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
                      <option value="">Unassigned</option>
                      {owners.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name.en}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Received">
                    <PickerInput
                      type="date"
                      value={draft.receivedOn}
                      onChange={(e) => set('receivedOn', e.target.value)}
                      icon={<CalendarDays className="size-3.5" />}
                    />
                  </Field>
                </div>
              )}
            </section>

            <hr className="border-line" />

            <section>
              <SectionTitle title="Next follow-up" note="Optional · Schedule a first response or a reminder." />
              <div className="grid grid-cols-2 gap-x-3">
                <Field label="Date">
                  <PickerInput
                    type="date"
                    value={followDate}
                    onChange={(e) => {
                      setFollowDate(e.target.value)
                      setProblems((p) => ({ ...p, followUp: undefined }))
                    }}
                    className={faulty(problems.followUp)}
                    aria-label="Follow-up date"
                    icon={<CalendarDays className="size-3.5" />}
                  />
                </Field>
                <Field label="Time">
                  <PickerInput
                    type="time"
                    value={followTime}
                    onChange={(e) => {
                      setFollowTime(e.target.value)
                      setProblems((p) => ({ ...p, followUp: undefined }))
                    }}
                    aria-label="Follow-up time"
                    icon={<Clock className="size-3.5" />}
                  />
                </Field>
              </div>
              {editing && (
                <>
                  <Field label="Next step">
                    <TextInput value={draft.nextStep} onChange={(e) => set('nextStep', e.target.value)} placeholder="Send shortlist & fee proposal" />
                  </Field>
                  <Field label="Details">
                    <TextArea
                      rows={3}
                      value={draft.nextStepDetail}
                      onChange={(e) => set('nextStepDetail', e.target.value)}
                      placeholder="What has to happen, and anything to check first…"
                    />
                  </Field>
                </>
              )}
              <p className={`text-[11px] ${problems.followUp ? 'font-medium text-neg' : 'text-ink-3'}`}>
                {problems.followUp ?? 'Arabia Standard Time (UTC+3). Leave both blank if a follow-up is not scheduled.'}
              </p>
            </section>

            {!editing && (
              <div className="rounded-control border border-line bg-sunken p-3">
                <p className="text-[12px] font-medium text-ink">A clear starting point</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                  Creating this lead adds it to the lead register. It does not send a message or notify the employer.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
          {lead && canRemove('system') ? (
            <button type="button" onClick={handleDelete} className="btn btn-danger">
              Delete lead
            </button>
          ) : (
            <p className="text-[11px] text-ink-3">
              {editing ? 'Changes are saved to the lead and its history.' : 'You can update lead details and progress after creation.'}
            </p>
          )}
          <div className="flex gap-2">
            <SecondaryButton onClick={() => navigate(lead ? `/leads/${lead.id}` : '/leads')}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">{lead ? 'Save changes' : 'Create lead'}</PrimaryButton>
          </div>
        </div>
      </form>

      <DataContext right="Employer relations · Internal use only" />
    </div>
  )
}
