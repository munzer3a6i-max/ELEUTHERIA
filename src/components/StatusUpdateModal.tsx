import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { pipelineForType, nextStatus } from '../data/statusPipelines'
import { CASH_ASSISTANCE, DEPLOYMENT_STAGE, SELECTION_STAGE } from '../data/businessRules'
import Modal from './Modal'
import { Field, SelectInput, TextInput, TextArea, PrimaryButton, SecondaryButton } from './form'
import type { StatusHistoryEntry } from '../types'

/**
 * The fee an agent earns at a milestone is booked as their commission, so the
 * stage itself costs nothing. A candidate who came to us directly has no agent
 * to pay, and gets cash assistance at the same two points instead. Either way
 * the money is counted once.
 */
function milestoneCost(label: string, hasAgent: boolean): number | null {
  if (label !== SELECTION_STAGE && label !== DEPLOYMENT_STAGE) return null
  return hasAgent ? 0 : CASH_ASSISTANCE
}

export default function StatusUpdateModal({
  requestType,
  currentStatusLabel,
  agentId = null,
  initial,
  onClose,
  onSubmit,
}: {
  requestType: 'Domestic' | 'Profession'
  currentStatusLabel: string | null
  /** The agent who introduced this candidate, when one did. */
  agentId?: string | null
  initial?: StatusHistoryEntry
  onClose: () => void
  onSubmit: (entry: Omit<StatusHistoryEntry, 'id'>) => void
}) {
  const staff = useAppStore((s) => s.staff)
  const allPaymentSources = useAppStore((s) => s.paymentSources)
  const paymentSources = allPaymentSources.filter((p) => p.scopes.includes('Request Status'))
  const { t, language } = useTranslation()
  const pipeline = pipelineForType(requestType)
  const suggested = nextStatus(requestType, currentStatusLabel)

  const [status, setStatus] = useState(initial?.status ?? suggested?.label ?? pipeline[0]?.label ?? '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const hasAgent = agentId !== null
  const [cost, setCost] = useState(
    String(
      initial?.cost ??
        (suggested ? (milestoneCost(suggested.label, hasAgent) ?? suggested.defaultCost) : 0),
    ),
  )
  const [paymentSourceId, setPaymentSourceId] = useState(initial?.paymentSourceId ?? paymentSources[0]?.id ?? '')
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(initial?.responsibleEmployeeId ?? staff[0]?.id ?? '')
  const [attachmentName, setAttachmentName] = useState<string | null>(initial?.attachmentName ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const selectedDef = pipeline.find((p) => p.label === status)
  const isEditing = Boolean(initial)

  function handleStatusChange(label: string) {
    setStatus(label)
    if (!isEditing) {
      const def = pipeline.find((p) => p.label === label)
      if (def) setCost(String(milestoneCost(label, hasAgent) ?? def.defaultCost))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!status || !paymentSourceId || !responsibleEmployeeId) return
    onSubmit({ status, date, cost: Number(cost) || 0, paymentSourceId, responsibleEmployeeId, attachmentName, notes: notes.trim() })
  }

  return (
    <Modal
      title={isEditing ? (language === 'ar' ? 'تعديل تحديث الحالة' : 'Edit Status Update') : language === 'ar' ? 'إضافة تحديث حالة' : 'Add New Status Update'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Field label={t('label_status')}>
          <SelectInput value={status} onChange={(e) => handleStatusChange(e.target.value)}>
            {pipeline.map((p) => (
              <option key={p.id} value={p.label}>
                {p.label}
                {p.isException ? ' (exception)' : ''}
              </option>
            ))}
          </SelectInput>
        </Field>
        {selectedDef?.costNote && <p className="-mt-2 mb-3 text-[10px] text-ink-3">{selectedDef.costNote}</p>}
        {milestoneCost(status, hasAgent) !== null && (
          <p className="-mt-2 mb-3 rounded-control border border-line bg-sunken p-2 text-[10.5px] leading-relaxed text-ink-3">
            {hasAgent
              ? language === 'ar'
                ? 'أتعاب الوكيل تُسجَّل في صفحة الوكلاء، لذلك تبقى تكلفة هذه المرحلة صفرًا حتى لا تُحتسب مرتين.'
                : "The agent's fee is booked on the Agents page, so this stage stays at zero and the money is counted once."
              : language === 'ar'
                ? 'لا يوجد وكيل لهذه المرشحة، لذلك تُصرف مساعدة نقدية بدلًا من أتعاب الوكيل.'
                : 'No agent introduced this candidate, so cash assistance is paid instead of an agent fee.'}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_date')}>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label={`${language === 'ar' ? 'التكلفة' : 'Cost'} (USD)`}>
            <TextInput type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'مصدر الدفع' : 'Payment Source'}>
            <SelectInput value={paymentSourceId} onChange={(e) => setPaymentSourceId(e.target.value)}>
              {paymentSources.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'الموظف المسؤول' : 'Responsible Employee'}>
            <SelectInput value={responsibleEmployeeId} onChange={(e) => setResponsibleEmployeeId(e.target.value)}>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name.en}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label={language === 'ar' ? 'المرفق (اختياري)' : 'Attachment (optional)'}>
          <input
            type="file"
            onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? attachmentName)}
            className="block w-full text-[11px] text-ink-2 file:me-2 file:rounded-control file:border-0 file:bg-raised file:px-2 file:py-1 file:text-[11px] file:text-ink-2"
          />
          {attachmentName && <p className="mt-1 text-[10px] text-ink-3">{attachmentName}</p>}
        </Field>
        <Field label={language === 'ar' ? 'ملاحظات' : 'Notes'}>
          <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{isEditing ? t('action_save') : t('action_add')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
