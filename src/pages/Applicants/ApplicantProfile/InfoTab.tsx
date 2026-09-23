import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Globe, FileText, Upload, ExternalLink } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import Modal from '../../../components/Modal'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../../../components/form'
import { clearWorkerCv, setWorkerCv, useCvUrl } from '../../../lib/cvs'
import type { Applicant } from '../../../types'

export default function InfoTab({ applicant }: { applicant: Applicant }) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const addExperience = useAppStore((s) => s.addExperience)
  const deleteExperience = useAppStore((s) => s.deleteExperience)
  const addEducation = useAppStore((s) => s.addEducation)
  const deleteEducation = useAppStore((s) => s.deleteEducation)
  const agencies = useAppStore((s) => s.agencies)
  const employers = useAppStore((s) => s.employers)
  const staff = useAppStore((s) => s.staff)
  const allRequests = useAppStore((s) => s.requests)
  const requests = allRequests.filter((r) => r.applicantId === applicant.id)
  const { t, tb, language } = useTranslation()

  const [expOpen, setExpOpen] = useState(false)
  const [eduOpen, setEduOpen] = useState(false)

  const agency = agencies.find((a) => a.id === applicant.recruitmentAgencyId)

  function handleCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setWorkerCv(applicant, file).catch((problem: Error) => window.alert(problem.message))
  }

  function handleCvRemove() {
    const sure = window.confirm(
      language === 'ar'
        ? 'حذف السيرة الذاتية؟ ستُزال أيضاً من الموقع.'
        : 'Remove this CV? It is taken off the website as well.',
    )
    if (sure) clearWorkerCv(applicant).catch((problem: Error) => window.alert(problem.message))
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="rounded-panel border border-line bg-surface p-4">
          <h2 className="mb-3 panel-title">
            {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
            <MetaField label={t('label_english_name')} value={applicant.englishName} onSave={(v) => updateApplicant(applicant.id, { englishName: v })} />
            <MetaField label={t('label_arabic_name')} value={applicant.arabicName} onSave={(v) => updateApplicant(applicant.id, { arabicName: v })} dir="rtl" />
            <MetaField label={language === 'ar' ? 'الجنس' : 'Gender'} value={applicant.gender} readOnly />
            <MetaField
              label={language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
              value={applicant.dob}
              type="date"
              onSave={(v) => updateApplicant(applicant.id, { dob: v })}
            />
            <MetaField label={language === 'ar' ? 'الدولة' : 'Country'} value={applicant.country} readOnly />
            <MetaField label={language === 'ar' ? 'المهنة' : 'Profession'} value={applicant.profession} readOnly />
            <MetaField label={language === 'ar' ? 'رقم الجواز' : 'Passport No.'} value={applicant.passportNo} onSave={(v) => updateApplicant(applicant.id, { passportNo: v })} />
            <MetaField
              label={language === 'ar' ? 'بداية الجواز' : 'Passport Start'}
              value={applicant.passportStart}
              type="date"
              onSave={(v) => updateApplicant(applicant.id, { passportStart: v })}
            />
            <MetaField
              label={language === 'ar' ? 'نهاية الجواز' : 'Passport End'}
              value={applicant.passportEnd}
              type="date"
              onSave={(v) => updateApplicant(applicant.id, { passportEnd: v })}
            />
            <MetaField label={language === 'ar' ? 'رقم الهوية' : 'ID Number'} value={applicant.idNumber} onSave={(v) => updateApplicant(applicant.id, { idNumber: v })} />
            <MetaField label={t('label_phone')} value={applicant.phone} onSave={(v) => updateApplicant(applicant.id, { phone: v })} />
            <MetaField label={language === 'ar' ? 'الهاتف الأرضي' : 'Telephone'} value={applicant.telephone} onSave={(v) => updateApplicant(applicant.id, { telephone: v })} />
          </div>
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="panel-title">
              {language === 'ar' ? 'السيرة الذاتية' : 'CV'}
            </h2>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-ink hover:bg-accent">
              <Upload className="size-3.5" /> {language === 'ar' ? 'رفع السيرة الذاتية' : 'Upload CV'}
              <input type="file" className="hidden" onChange={handleCv} />
            </label>
          </div>
          <CvRow applicant={applicant} onRemove={handleCvRemove} />
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="panel-title">
              {language === 'ar' ? 'الخبرات' : 'Experience'}
            </h2>
            <button
              type="button"
              onClick={() => setExpOpen(true)}
              className="flex items-center gap-1 rounded-control border border-line-strong bg-raised px-2.5 py-1 text-[11px] text-ink-2 hover:border-accent-line"
            >
              <Plus className="size-3" /> {t('action_add')}
            </button>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {applicant.experience.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between py-2 text-xs">
                <div>
                  <p className="text-ink">{exp.title}</p>
                  <p className="text-[10px] text-ink-3">
                    {exp.employer} · {exp.years} {language === 'ar' ? 'سنوات' : 'yrs'}
                  </p>
                </div>
                <button type="button" onClick={() => deleteExperience(applicant.id, exp.id)} className="text-ink-3 hover:text-neg">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {applicant.experience.length === 0 && (
              <p className="py-4 text-center text-[11px] text-ink-3">
                {language === 'ar' ? 'لا توجد خبرات مسجلة' : 'No experience recorded.'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="panel-title">
              {language === 'ar' ? 'التعليم' : 'Education'}
            </h2>
            <button
              type="button"
              onClick={() => setEduOpen(true)}
              className="flex items-center gap-1 rounded-control border border-line-strong bg-raised px-2.5 py-1 text-[11px] text-ink-2 hover:border-accent-line"
            >
              <Plus className="size-3" /> {t('action_add')}
            </button>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {applicant.education.map((edu) => (
              <div key={edu.id} className="flex items-center justify-between py-2 text-xs">
                <div>
                  <p className="text-ink">{edu.degree}</p>
                  <p className="text-[10px] text-ink-3">
                    {edu.institution} · {edu.year}
                  </p>
                </div>
                <button type="button" onClick={() => deleteEducation(applicant.id, edu.id)} className="text-ink-3 hover:text-neg">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {applicant.education.length === 0 && (
              <p className="py-4 text-center text-[11px] text-ink-3">
                {language === 'ar' ? 'لا يوجد تعليم مسجل' : 'No education recorded.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-panel border border-line bg-surface p-4">
          <h2 className="mb-3 panel-title">
            {language === 'ar' ? 'مكتب الاستقدام' : 'Recruitment Agency'}
          </h2>
          {agency ? (
            <div className="text-xs">
              <p className="font-medium text-ink">{tb({ en: agency.englishName, ar: agency.arabicName })}</p>
              <p className="mt-1 text-ink-3">{agency.phone}</p>
            </div>
          ) : (
            <p className="text-[11px] text-ink-3">
              {applicant.type === 'Domestic'
                ? language === 'ar'
                  ? 'العمالة المنزلية تتطلب عادة مكتب استقدام.'
                  : 'Domestic workers normally require a recruitment agency.'
                : language === 'ar'
                  ? 'لا يوجد مكتب استقدام مرتبط.'
                  : 'No recruitment agency linked.'}
            </p>
          )}
        </div>

        <div className="rounded-panel border border-line bg-surface p-4">
          <h2 className="mb-3 panel-title">
            {language === 'ar' ? 'طلبات الاستقدام' : 'Recruitment Requests'}
          </h2>
          <div className="flex flex-col gap-3">
            {requests.map((r) => {
              const employer = employers.find((e) => e.id === r.employerId)
              const officer = staff.find((s) => s.id === r.responsibleEmployeeId)
              return (
                <Link
                  key={r.id}
                  to={`/recruitments/${r.id}`}
                  className="block rounded-control border border-line bg-sunken p-3 text-xs hover:border-accent-line"
                >
                  <p className="font-medium text-ink">
                    {employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '-'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-3">
                    {language === 'ar' ? 'الموظف المسؤول' : 'Responsible officer'}: {officer ? tb(officer.name) : '-'}
                  </p>
                </Link>
              )
            })}
            {requests.length === 0 && (
              <p className="text-[11px] text-ink-3">
                {language === 'ar' ? 'لا توجد طلبات استقدام مرتبطة بعد.' : 'No recruitment requests yet.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {expOpen && (
        <ExperienceModal
          onClose={() => setExpOpen(false)}
          onSubmit={(entry) => {
            addExperience(applicant.id, entry)
            setExpOpen(false)
          }}
        />
      )}
      {eduOpen && (
        <EducationModal
          onClose={() => setEduOpen(false)}
          onSubmit={(entry) => {
            addEducation(applicant.id, entry)
            setEduOpen(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * What the office has, and where it can be read. The file itself opens through
 * a signed link to the private copy, never the public one: the office should
 * see the document whether or not this worker is on the website.
 */
function CvRow({ applicant, onRemove }: { applicant: Applicant; onRemove: () => void }) {
  const { language } = useTranslation()
  const url = useCvUrl(applicant)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-xs text-ink-2">
        <FileText className="size-4 text-ink-3" />
        {applicant.cvFileName ?? (language === 'ar' ? 'لم يتم رفع سيرة ذاتية' : 'No CV uploaded')}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
          >
            <ExternalLink className="size-3" /> {language === 'ar' ? 'فتح' : 'Open'}
          </a>
        )}
        {applicant.cvFileName && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-[11px] text-ink-3 hover:text-neg"
          >
            <Trash2 className="size-3" /> {language === 'ar' ? 'حذف' : 'Remove'}
          </button>
        )}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
        <Globe className="size-3.5" />
        {applicant.cvLinkedToWebsite
          ? language === 'ar' ? 'منشورة على الموقع' : 'On the website'
          : language === 'ar' ? 'غير منشورة على الموقع' : 'Not on the website'}
      </span>
    </div>
  )
}

function MetaField({
  label,
  value,
  onSave,
  readOnly,
  type = 'text',
  dir,
}: {
  label: string
  value: string
  onSave?: (v: string) => void
  readOnly?: boolean
  type?: string
  dir?: 'rtl' | 'ltr'
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (readOnly || !onSave) {
    return (
      <div>
        <p className="text-ink-3">{label}</p>
        <p className="mt-0.5 text-ink" dir={dir}>
          {value || '-'}
        </p>
      </div>
    )
  }

  if (editing) {
    return (
      <div>
        <p className="mb-0.5 text-ink-3">{label}</p>
        <input
          autoFocus
          type={type}
          value={draft}
          dir={dir}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onSave(draft)
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave(draft)
              setEditing(false)
            }
          }}
          className="w-full rounded-control border border-accent-line bg-sunken px-1.5 py-0.5 text-[11px] text-ink focus:outline-none"
        />
      </div>
    )
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-start">
      <p className="text-ink-3">{label}</p>
      <p className="mt-0.5 text-ink hover:text-accent-text" dir={dir}>
        {value || '-'}
      </p>
    </button>
  )
}

function ExperienceModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (entry: { title: string; employer: string; years: number }) => void
}) {
  const { t, language } = useTranslation()
  const [title, setTitle] = useState('')
  const [employer, setEmployer] = useState('')
  const [years, setYears] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), employer: employer.trim(), years: Number(years) || 0 })
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة خبرة' : 'Add Experience'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </Field>
        <Field label={language === 'ar' ? 'جهة العمل' : 'Employer'}>
          <TextInput value={employer} onChange={(e) => setEmployer(e.target.value)} />
        </Field>
        <Field label={language === 'ar' ? 'عدد السنوات' : 'Years'}>
          <TextInput type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('action_add')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}

function EducationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (entry: { degree: string; institution: string; year: string }) => void
}) {
  const { t, language } = useTranslation()
  const [degree, setDegree] = useState('')
  const [institution, setInstitution] = useState('')
  const [year, setYear] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!degree.trim()) return
    onSubmit({ degree: degree.trim(), institution: institution.trim(), year: year.trim() })
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة تعليم' : 'Add Education'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={language === 'ar' ? 'الشهادة' : 'Degree / Certificate'}>
          <TextInput value={degree} onChange={(e) => setDegree(e.target.value)} required autoFocus />
        </Field>
        <Field label={language === 'ar' ? 'المؤسسة' : 'Institution'}>
          <TextInput value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </Field>
        <Field label={language === 'ar' ? 'السنة' : 'Year'}>
          <TextInput value={year} onChange={(e) => setYear(e.target.value)} placeholder="2020" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('action_add')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
