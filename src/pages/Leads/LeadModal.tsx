/*
  Adding an employer's enquiry, or bringing one up to date.

  Only the employer and what they asked for are required: an enquiry is worth
  recording the moment it lands, before anybody knows the contact's surname.
  Every time is typed on the Riyadh clock, which is what the register shows.
*/

import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useCurrentUser } from '../../lib/useCurrentUser'
import Modal from '../../components/Modal'
import { Field, TextInput, SelectInput, TextArea, PrimaryButton, SecondaryButton } from '../../components/form'
import { LEAD_CHANNELS, LEAD_SOURCES, LEAD_STAGES, astToday, fromAstInput, toAstInput } from '../../lib/leads'
import type { Lead } from '../../types'

type Draft = Omit<Lead, 'id' | 'createdOn'>

export default function LeadModal({
  lead,
  onClose,
  onSave,
  onDelete,
}: {
  /** The lead being edited; null to add a new one. */
  lead: Lead | null
  onClose: () => void
  onSave: (draft: Draft) => void
  /** Offered only when editing, and only to a role that may delete. */
  onDelete?: () => void
}) {
  const staff = useAppStore((s) => s.staff)
  const { member } = useCurrentUser()

  const [draft, setDraft] = useState<Draft>(() =>
    lead
      ? (({ id: _id, createdOn: _created, ...rest }) => rest)(lead)
      : {
          employerName: '',
          contactName: '',
          phone: '',
          email: '',
          need: '',
          city: '',
          source: 'WhatsApp',
          stage: 'New enquiry',
          ownerId: member?.id ?? '',
          receivedOn: astToday(),
          lastContactAt: '',
          lastContactChannel: '',
          nextFollowUpAt: '',
          nextStep: '',
          notes: '',
        },
  )
  const [problem, setProblem] = useState<string | null>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.employerName.trim()) return setProblem('The employer’s name is needed.')
    if (!draft.need.trim()) return setProblem('Say what they are asking for — “24 ICU & ER nurses”.')
    if (draft.lastContactAt && !draft.lastContactChannel) return setProblem('Say how the last contact was made.')
    onSave({
      ...draft,
      employerName: draft.employerName.trim(),
      contactName: draft.contactName.trim(),
      need: draft.need.trim(),
      city: draft.city.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      nextStep: draft.nextStep.trim(),
      notes: draft.notes.trim(),
      // No contact time means no contact channel either.
      lastContactChannel: draft.lastContactAt ? draft.lastContactChannel : '',
    })
  }

  return (
    <Modal title={lead ? 'Edit lead' : 'Add lead'} onClose={onClose} width="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          <Field label="Employer *">
            <TextInput
              value={draft.employerName}
              onChange={(e) => set('employerName', e.target.value)}
              placeholder="Al Noor Medical Group"
              autoFocus
            />
          </Field>
          <Field label="Contact person">
            <TextInput value={draft.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Dr. Faisal Al Harbi" />
          </Field>
          <Field label="Recruitment need *">
            <TextInput value={draft.need} onChange={(e) => set('need', e.target.value)} placeholder="24 ICU & ER nurses" />
          </Field>
          <Field label="City">
            <TextInput value={draft.city} onChange={(e) => set('city', e.target.value)} placeholder="Riyadh" />
          </Field>
          <Field label="Phone">
            <TextInput value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966 5x xxx xxxx" />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Source">
            <SelectInput value={draft.source} onChange={(e) => set('source', e.target.value as Draft['source'])}>
              {LEAD_SOURCES.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Process stage">
            <SelectInput value={draft.stage} onChange={(e) => set('stage', e.target.value as Draft['stage'])}>
              {LEAD_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Owner">
            <SelectInput value={draft.ownerId} onChange={(e) => set('ownerId', e.target.value)}>
              <option value="">Unassigned</option>
              {staff
                .filter((m) => m.status === 'Active' && m.role !== 'none')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name.en}
                  </option>
                ))}
            </SelectInput>
          </Field>
          <Field label="Received">
            <TextInput type="date" value={draft.receivedOn} onChange={(e) => set('receivedOn', e.target.value)} />
          </Field>
        </div>

        <div className="mt-1 grid grid-cols-1 gap-x-3 border-t border-line pt-3 sm:grid-cols-2">
          <Field label="Last contact (AST)" hint="Leave empty while they have not been answered.">
            <TextInput
              type="datetime-local"
              value={toAstInput(draft.lastContactAt)}
              onChange={(e) => set('lastContactAt', fromAstInput(e.target.value))}
            />
          </Field>
          <Field label="Last contact via">
            <SelectInput
              value={draft.lastContactChannel}
              onChange={(e) => set('lastContactChannel', e.target.value as Draft['lastContactChannel'])}
              disabled={!draft.lastContactAt}
            >
              <option value="">—</option>
              {LEAD_CHANNELS.map((channel) => (
                <option key={channel}>{channel}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Next follow-up (AST)">
            <TextInput
              type="datetime-local"
              value={toAstInput(draft.nextFollowUpAt)}
              onChange={(e) => set('nextFollowUpAt', fromAstInput(e.target.value))}
            />
          </Field>
          <Field label="Next step">
            <TextInput value={draft.nextStep} onChange={(e) => set('nextStep', e.target.value)} placeholder="Share candidate CVs" />
          </Field>
        </div>

        <Field label="Notes">
          <TextArea rows={3} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        {problem && <p className="mt-1 text-[11px] font-medium text-neg">{problem}</p>}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span>
            {onDelete && (
              <button type="button" onClick={onDelete} className="text-[12px] text-neg hover:underline">
                Delete lead
              </button>
            )}
          </span>
          <span className="flex gap-2">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">{lead ? 'Save changes' : 'Add lead'}</PrimaryButton>
          </span>
        </div>
      </form>
    </Modal>
  )
}
