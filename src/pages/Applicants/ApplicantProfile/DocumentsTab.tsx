import { useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { SelectInput } from '../../../components/form'
import type { Applicant } from '../../../types'

export default function DocumentsTab({ applicant }: { applicant: Applicant }) {
  const addApplicantDocument = useAppStore((s) => s.addApplicantDocument)
  const deleteApplicantDocument = useAppStore((s) => s.deleteApplicantDocument)
  const { t, language } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const CATEGORIES = [
    language === 'ar' ? 'الهوية' : 'Identification',
    language === 'ar' ? 'طبي' : 'Medical',
    language === 'ar' ? 'العقد' : 'Contract',
    language === 'ar' ? 'التدريب' : 'Training',
    language === 'ar' ? 'السفر' : 'Travel',
    language === 'ar' ? 'أخرى' : 'Other',
  ]
  const [category, setCategory] = useState(CATEGORIES[0])

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      addApplicantDocument(applicant.id, { name: file.name, category })
    }
    e.target.value = ''
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`${t('action_delete')} "${name}"?`)) deleteApplicantDocument(applicant.id, id)
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="panel-title">
          {language === 'ar' ? 'المستندات' : 'Documents'}
        </h2>
        <div className="flex items-center gap-2">
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)} className="w-40">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelected} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-xs font-bold text-accent-ink hover:bg-accent"
          >
            <Upload className="size-3.5" /> {language === 'ar' ? 'رفع مستند' : 'Upload Document'}
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-line">
        {applicant.documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-ink-3" />
              <div>
                <p className="text-xs text-ink">{doc.name}</p>
                <p className="text-[10px] text-ink-3">
                  {doc.category} · {language === 'ar' ? 'تم الرفع' : 'Uploaded'} {doc.uploadedOn}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => handleDelete(doc.id, doc.name)} className="text-ink-3 hover:text-neg">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {applicant.documents.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-3">
            {language === 'ar' ? 'لا توجد مستندات مرفوعة بعد.' : 'No documents uploaded yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
