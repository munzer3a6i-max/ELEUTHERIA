import { useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { TextArea, PrimaryButton } from '../../../components/form'
import type { Applicant } from '../../../types'

export default function NotesTab({ applicant }: { applicant: Applicant }) {
  const addApplicantNote = useAppStore((s) => s.addApplicantNote)
  const { language } = useTranslation()
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    addApplicantNote(applicant.id, text.trim())
    setText('')
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-5">
      <h2 className="mb-4 panel-title">
        {language === 'ar' ? 'ملاحظات وسجل' : 'Notes & History'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-5">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={language === 'ar' ? 'أضف ملاحظة حول هذا المتقدم...' : 'Add a note about this applicant...'}
          className="mb-2"
        />
        <PrimaryButton type="submit" disabled={!text.trim()}>
          {language === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}
        </PrimaryButton>
      </form>

      <div className="flex flex-col divide-y divide-line">
        {applicant.notes.map((note) => (
          <div key={note.id} className="py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-ink">{note.author}</span>
              <span className="text-[10px] text-ink-3">{note.date}</span>
            </div>
            <p className="text-xs text-ink-2">{note.text}</p>
          </div>
        ))}
        {applicant.notes.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-3">
            {language === 'ar' ? 'لا توجد ملاحظات بعد.' : 'No notes yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
