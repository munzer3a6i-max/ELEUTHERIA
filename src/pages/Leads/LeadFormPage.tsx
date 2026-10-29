/*
  Add new lead, and the same page for bringing one up to date.

  Built from the "Add new lead" frame in the design file. Adding asks only
  what the frame asks -- who, how to reach them, where it came from, what they
  want, and where it stands -- because an enquiry is worth recording the moment
  it lands. Editing adds the rest of the record the lead page shows: the
  contact's role, the industry and place, the brief in its parts, the owner,
  and the next step in words.

  Follow-up times are typed on the Riyadh clock, which is what every lead page
  shows.
*/

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Clock } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCurrentUser } from '../../lib/useCurrentUser'
import { LEAD_SOURCES, LEAD_STAGES, astToday, fromAstInput, leadRef, toAstInput } from '../../lib/leads'
import {
  ChoiceCard,
  DataContext,
  Field,
  GoldButton,
  LightButton,
  PickerBox,
  SectionTitle,
  SelectBox,
  TextArea,
  TextBox,
} from './leadUi'
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
      <div className="flex flex-col gap-4 p-4 sm:p-8">
        <p className="text-[14px] text-[#a6b4c9]">This lead no longer exists.</p>
        <Link to="/leads" className="text-[13px] font-medium text-[#e5b44d] hover:underline">
          Back to leads →
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
    <div className="flex flex-col gap-6 p-4 sm:p-8">
      {/* --- introduction --------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2.5 text-[13px]">
          <Link to="/leads" className="text-[#a6b4c9] hover:text-ink">
            Leads
          </Link>
          <ChevronRight aria-hidden="true" className="size-3 text-[#a6b4c9]" />
          {lead && (
            <>
              <Link to={`/leads/${lead.id}`} className="text-[#a6b4c9] hover:text-ink">
                {lead.employerName}
              </Link>
              <ChevronRight aria-hidden="true" className="size-3 text-[#a6b4c9]" />
            </>
          )}
          <span className="text-[#e5b44d]">{lead ? 'Edit lead' : 'Add new lead'}</span>
        </nav>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[34px] font-medium leading-tight text-ink">{lead ? 'Edit lead' : 'Add new lead'}</h1>
          <p className="text-[14px] leading-[1.4] text-[#a6b4c9]">
            {lead
              ? `${leadRef(lead)} · Bring the enquiry, its brief and its next step up to date.`
              : 'Capture an employer enquiry and give it a clear next step.'}
          </p>
        </div>
      </div>

      {/* --- the form ------------------------------------------------------- */}
      <form onSubmit={handleSubmit} noValidate className="overflow-hidden rounded-[18px] bg-white text-[#17263c]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e8ef] px-5 py-[18px] sm:px-7">
          <p className="text-[14px] font-medium">Employer recruitment enquiry</p>
          <p className="text-[12px] text-[#69768a]">* Required fields · All other fields are optional</p>
        </div>

        <div className="flex flex-col gap-8 p-5 sm:p-7 xl:flex-row">
          {/* left: the enquiry -------------------------------------------- */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <section className="flex flex-col gap-4">
              <SectionTitle title="Company & contact details" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="COMPANY / EMPLOYER *" error={problems.employerName}>
                  <TextBox
                    value={draft.employerName}
                    onChange={(e) => set('employerName', e.target.value)}
                    placeholder="Enter company name"
                    error={Boolean(problems.employerName)}
                    autoFocus={!editing}
                  />
                </Field>
                <Field label="CONTACT NAME *" error={problems.contactName}>
                  <TextBox
                    value={draft.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    placeholder="Enter full name"
                    error={Boolean(problems.contactName)}
                  />
                </Field>
                <Field label="EMAIL ADDRESS">
                  <TextBox
                    type="email"
                    value={draft.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="name@company.com"
                    error={Boolean(problems.contact)}
                  />
                </Field>
                <Field label="PHONE / WHATSAPP">
                  <TextBox
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+966 5X XXX XXXX"
                    error={Boolean(problems.contact)}
                  />
                </Field>
                {editing && (
                  <>
                    <Field label="CONTACT ROLE">
                      <TextBox value={draft.contactRole} onChange={(e) => set('contactRole', e.target.value)} placeholder="HR Director" />
                    </Field>
                    <Field label="INDUSTRY">
                      <TextBox value={draft.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Healthcare" />
                    </Field>
                    <Field label="CITY">
                      <TextBox value={draft.city} onChange={(e) => set('city', e.target.value)} placeholder="Riyadh" />
                    </Field>
                    <Field label="COUNTRY">
                      <TextBox value={draft.country} onChange={(e) => set('country', e.target.value)} placeholder="Saudi Arabia" />
                    </Field>
                  </>
                )}
              </div>
              <p className={`text-[12px] leading-[1.45] ${problems.contact ? 'text-[#b5473d]' : 'text-[#69768a]'}`}>
                {problems.contact ?? 'Provide at least one contact method: email or phone / WhatsApp. Include the country code.'}
              </p>
            </section>

            <hr className="border-[#e3e8ef]" />

            <section className="flex flex-col gap-3">
              <SectionTitle title="Lead source *" note="Where did this enquiry originate?" />
              <div role="radiogroup" aria-label="Lead source" className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {LEAD_SOURCES.map((source) => (
                  <ChoiceCard key={source} label={source} selected={draft.source === source} onSelect={() => set('source', source)} />
                ))}
              </div>
              <p className="text-[12px] leading-[1.45] text-[#69768a]">
                Source is recorded manually. Selecting a channel does not connect or import messages.
              </p>
            </section>

            <hr className="border-[#e3e8ef]" />

            <section className="flex flex-col gap-3.5">
              <SectionTitle title="Recruitment requirements" />
              {editing && (
                <>
                  <Field label="POSITIONS REQUIRED" hint="Short, as the register shows it: “24 ICU & ER nurses”.">
                    <TextBox value={draft.need} onChange={(e) => set('need', e.target.value)} placeholder="24 registered nurses — ICU & ER" />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="EXPERIENCE">
                      <TextBox value={draft.experience} onChange={(e) => set('experience', e.target.value)} placeholder="3+ years" />
                    </Field>
                    <Field label="TARGET START">
                      <TextBox value={draft.targetStart} onChange={(e) => set('targetStart', e.target.value)} placeholder="Jan 2027" />
                    </Field>
                  </div>
                  <Field label="EMPLOYER REQUIREMENTS">
                    <TextArea
                      value={draft.requirements}
                      onChange={(e) => set('requirements', e.target.value)}
                      placeholder="Licences, eligibility, experience the employer insists on…"
                    />
                  </Field>
                </>
              )}
              <Field label={editing ? 'ENQUIRY AS RECEIVED' : 'ENQUIRY / REQUIREMENTS *'} error={problems.enquiry}>
                <TextArea
                  value={draft.enquiry}
                  onChange={(e) => set('enquiry', e.target.value)}
                  placeholder="Describe the roles, number of workers, work location and expected start date…"
                  error={Boolean(problems.enquiry)}
                />
              </Field>
            </section>

            {!editing && (
              <Field label="INTERNAL NOTES · OPTIONAL" hint="Internal only. Notes are not sent to the employer.">
                <TextArea
                  value={draft.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Add context, preferences or details for the team…"
                />
              </Field>
            )}
          </div>

          <div aria-hidden="true" className="hidden w-px shrink-0 self-stretch bg-[#e3e8ef] xl:block" />

          {/* right: ownership and the next step ---------------------------- */}
          <div className="flex w-full shrink-0 flex-col gap-6 xl:w-[408px]">
            <SectionTitle title="Ownership & progress" note="Set responsibility and the starting point for this lead." />

            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] font-medium tracking-[0.08em] text-[#69768a]">CONTACT STATUS *</span>
              <div role="radiogroup" aria-label="Contact status" className="flex gap-2.5">
                <ChoiceCard size="large" label="Not contacted" selected={!draft.contacted} onSelect={() => set('contacted', false)} />
                <ChoiceCard size="large" label="Contacted" selected={draft.contacted} onSelect={() => set('contacted', true)} />
              </div>
              <p className="text-[12px] leading-[1.45] text-[#69768a]">
                {draft.contacted
                  ? 'Log each conversation from the lead page to keep its history.'
                  : 'No outreach recorded yet.'}
              </p>
            </div>

            <Field label="CURRENT PROCESS STAGE *" hint="New enquiries stay at this stage until the first contact is made.">
              <SelectBox value={draft.stage} onChange={(e) => set('stage', e.target.value as Draft['stage'])}>
                {LEAD_STAGES.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </SelectBox>
            </Field>

            {editing && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="LEAD OWNER">
                  <SelectBox value={draft.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
                    <option value="">Unassigned</option>
                    {owners.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name.en}
                      </option>
                    ))}
                  </SelectBox>
                </Field>
                <Field label="RECEIVED">
                  <PickerBox
                    type="date"
                    value={draft.receivedOn}
                    onChange={(e) => set('receivedOn', e.target.value)}
                    icon={<CalendarDays className="size-[18px] text-[#e5b44d]" />}
                  />
                </Field>
              </div>
            )}

            <hr className="border-[#e3e8ef]" />

            <section className="flex flex-col gap-4">
              <SectionTitle title="Next follow-up" note="Optional · Schedule a first response or a reminder." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="DATE">
                  <PickerBox
                    type="date"
                    value={followDate}
                    onChange={(e) => {
                      setFollowDate(e.target.value)
                      setProblems((p) => ({ ...p, followUp: undefined }))
                    }}
                    error={Boolean(problems.followUp)}
                    aria-label="Follow-up date"
                    icon={<CalendarDays className="size-[18px] text-[#e5b44d]" />}
                  />
                </Field>
                <Field label="TIME">
                  <PickerBox
                    type="time"
                    value={followTime}
                    onChange={(e) => {
                      setFollowTime(e.target.value)
                      setProblems((p) => ({ ...p, followUp: undefined }))
                    }}
                    aria-label="Follow-up time"
                    icon={<Clock className="size-[18px] text-[#69768a]" />}
                  />
                </Field>
              </div>
              {editing && (
                <>
                  <Field label="NEXT STEP">
                    <TextBox value={draft.nextStep} onChange={(e) => set('nextStep', e.target.value)} placeholder="Send shortlist & fee proposal" />
                  </Field>
                  <Field label="DETAILS">
                    <TextArea
                      value={draft.nextStepDetail}
                      onChange={(e) => set('nextStepDetail', e.target.value)}
                      placeholder="What has to happen, and anything to check first…"
                    />
                  </Field>
                </>
              )}
              <p className={`text-[12px] leading-[1.45] ${problems.followUp ? 'text-[#b5473d]' : 'text-[#69768a]'}`}>
                {problems.followUp ?? 'Arabia Standard Time (UTC+3). Leave both blank if a follow-up is not scheduled.'}
              </p>
            </section>

            {!editing && (
              <div className="flex flex-col gap-2 rounded-[12px] bg-[#f4f7fa] p-4">
                <p className="text-[13px] font-medium">A clear starting point</p>
                <p className="text-[12px] leading-[1.5] text-[#69768a]">
                  Creating this lead adds it to the lead register. It does not send a message or notify the employer.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e8ef] px-5 py-5 sm:px-7">
          {lead && canRemove('system') ? (
            <button type="button" onClick={handleDelete} className="text-[13px] font-medium text-[#b5473d] hover:underline">
              Delete lead
            </button>
          ) : (
            <p className="text-[12px] text-[#69768a]">
              {editing ? 'Changes are saved to the lead and its history.' : 'You can update lead details and progress after creation.'}
            </p>
          )}
          <div className="flex gap-3">
            <LightButton onClick={() => navigate(lead ? `/leads/${lead.id}` : '/leads')}>Cancel</LightButton>
            <GoldButton type="submit">{lead ? 'Save changes' : 'Create lead'}</GoldButton>
          </div>
        </div>
      </form>

      <DataContext right="Employer relations · Internal use only" />
    </div>
  )
}
