import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { User, Camera, Plus, Trash2, Globe, FileText, Upload } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { ApplicantStatus } from '../../types'

function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const diff = Date.now() - birth.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export default function ApplicantProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const applicant = useAppStore((s) => s.applicants.find((a) => a.id === id))
  const { language } = useTranslation()

  if (!applicant) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-[var(--text-primary)]">{language === 'ar' ? 'المتقدم غير موجود.' : 'Applicant not found.'}</p>
        <Link to="/applicants" className="text-xs text-amber-400 hover:text-amber-300">
          {language === 'ar' ? 'العودة إلى المتقدمين' : 'Back to Applicants'}
        </Link>
      </div>
    )
  }

  return <ApplicantProfileContent key={applicant.id} applicantId={applicant.id} onDeleted={() => navigate('/applicants')} />
}

function ApplicantProfileContent({ applicantId, onDeleted }: { applicantId: string; onDeleted: () => void }) {
  const applicant = useAppStore((s) => s.applicants.find((a) => a.id === applicantId))
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const deleteApplicant = useAppStore((s) => s.deleteApplicant)
  const addExperience = useAppStore((s) => s.addExperience)
  const deleteExperience = useAppStore((s) => s.deleteExperience)
  const addEducation = useAppStore((s) => s.addEducation)
  const deleteEducation = useAppStore((s) => s.deleteEducation)
  const agencies = useAppStore((s) => s.agencies)
  const employers = useAppStore((s) => s.employers)
  const staff = useAppStore((s) => s.staff)
  const allRequests = useAppStore((s) => s.requests)
  const requests = allRequests.filter((r) => r.applicantId === applicantId)
  const { t, tb, language } = useTranslation()

  const [expOpen, setExpOpen] = useState(false)
  const [eduOpen, setEduOpen] = useState(false)

  if (!applicant) {
    onDeleted()
    return null
  }

  const age = ageFromDob(applicant.dob)
  const agency = agencies.find((a) => a.id === applicant.recruitmentAgencyId)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateApplicant(applicantId, { photoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    updateApplicant(applicantId, { cvFileName: file.name })
    e.target.value = ''
  }

  function handleDelete() {
    if (window.confirm(`${t('action_delete')} ${applicant!.englishName}?`)) {
      deleteApplicant(applicantId)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Link to="/applicants" className="hover:text-[var(--text-primary)]">
            {t('nav_applicants')}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)]">{applicant.englishName}</span>
        </nav>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-rose-900 bg-rose-950/60 px-3 py-1.5 text-[11px] text-rose-400 hover:border-rose-700"
        >
          {t('action_delete')}
        </button>
      </div>

      {/* Basic Information */}
      <div className="flex items-start gap-5 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-[17px]">
        <div className="flex flex-col items-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/50 bg-[var(--surface-hover)] p-1 shadow-md">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[var(--surface-hover)]">
              {applicant.photoDataUrl ? (
                <img src={applicant.photoDataUrl} alt="" className="size-full object-cover" />
              ) : (
                <User className="size-10 text-[var(--text-muted)]" />
              )}
            </div>
          </div>
          <label className="mt-2 flex cursor-pointer items-center gap-1 rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] hover:border-amber-500/40">
            <Camera className="size-3" /> {language === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>

        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              {language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName}
            </h1>
            <select
              value={applicant.status}
              onChange={(e) => updateApplicant(applicantId, { status: e.target.value as ApplicantStatus })}
              className="rounded border border-[var(--edge)] bg-[var(--input)] px-2 py-0.5 text-[10px] font-bold text-amber-400 focus:outline-none"
            >
              {(['Available', 'Unavailable', 'Selected', 'Deployed'] as ApplicantStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <StatusBadge status={applicant.type === 'Domestic' ? t('type_domestic') : t('type_profession')} />
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-[11px]">
            <MetaField label={t('label_english_name')} value={applicant.englishName} onSave={(v) => updateApplicant(applicantId, { englishName: v })} />
            <MetaField label={t('label_arabic_name')} value={applicant.arabicName} onSave={(v) => updateApplicant(applicantId, { arabicName: v })} dir="rtl" />
            <MetaField label={language === 'ar' ? 'الجنس' : 'Gender'} value={applicant.gender} readOnly />
            <MetaField
              label={language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
              value={applicant.dob}
              type="date"
              onSave={(v) => updateApplicant(applicantId, { dob: v })}
            />
            <MetaField label={language === 'ar' ? 'العمر' : 'Age'} value={age !== null ? String(age) : '—'} readOnly />
            <MetaField label={language === 'ar' ? 'الدولة' : 'Country'} value={applicant.country} readOnly />
            <MetaField label={language === 'ar' ? 'رقم الجواز' : 'Passport No.'} value={applicant.passportNo} onSave={(v) => updateApplicant(applicantId, { passportNo: v })} />
            <MetaField
              label={language === 'ar' ? 'بداية الجواز' : 'Passport Start'}
              value={applicant.passportStart}
              type="date"
              onSave={(v) => updateApplicant(applicantId, { passportStart: v })}
            />
            <MetaField
              label={language === 'ar' ? 'نهاية الجواز' : 'Passport End'}
              value={applicant.passportEnd}
              type="date"
              onSave={(v) => updateApplicant(applicantId, { passportEnd: v })}
            />
            <MetaField label={language === 'ar' ? 'رقم الهوية' : 'ID Number'} value={applicant.idNumber} onSave={(v) => updateApplicant(applicantId, { idNumber: v })} />
            <MetaField label={t('label_phone')} value={applicant.phone} onSave={(v) => updateApplicant(applicantId, { phone: v })} />
            <MetaField label={language === 'ar' ? 'المهنة' : 'Profession'} value={applicant.profession} readOnly />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Experience, Education & CV */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
                {language === 'ar' ? 'السيرة الذاتية' : 'CV'}
              </h2>
              <label className="flex cursor-pointer items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-500">
                <Upload className="size-3.5" /> {language === 'ar' ? 'رفع السيرة الذاتية' : 'Upload CV'}
                <input type="file" className="hidden" onChange={handleCv} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <FileText className="size-4 text-[var(--text-muted)]" />
                {applicant.cvFileName ?? (language === 'ar' ? 'لم يتم رفع سيرة ذاتية' : 'No CV uploaded')}
              </span>
              <label className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={applicant.cvLinkedToWebsite}
                  onChange={(e) => updateApplicant(applicantId, { cvLinkedToWebsite: e.target.checked })}
                />
                <Globe className="size-3.5" />
                {language === 'ar' ? 'نشر على الموقع الإلكتروني' : 'Published to website'}
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
                {language === 'ar' ? 'الخبرات' : 'Experience'}
              </h2>
              <button
                type="button"
                onClick={() => setExpOpen(true)}
                className="flex items-center gap-1 rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] hover:border-amber-500/40"
              >
                <Plus className="size-3" /> {t('action_add')}
              </button>
            </div>
            <div className="flex flex-col divide-y divide-[var(--edge-soft2)]">
              {applicant.experience.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-2 text-xs">
                  <div>
                    <p className="text-[var(--text-primary)]">{exp.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {exp.employer} · {exp.years} {language === 'ar' ? 'سنوات' : 'yrs'}
                    </p>
                  </div>
                  <button type="button" onClick={() => deleteExperience(applicantId, exp.id)} className="text-[var(--text-muted)] hover:text-rose-400">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {applicant.experience.length === 0 && (
                <p className="py-4 text-center text-[11px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا توجد خبرات مسجلة' : 'No experience recorded.'}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
                {language === 'ar' ? 'التعليم' : 'Education'}
              </h2>
              <button
                type="button"
                onClick={() => setEduOpen(true)}
                className="flex items-center gap-1 rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] hover:border-amber-500/40"
              >
                <Plus className="size-3" /> {t('action_add')}
              </button>
            </div>
            <div className="flex flex-col divide-y divide-[var(--edge-soft2)]">
              {applicant.education.map((edu) => (
                <div key={edu.id} className="flex items-center justify-between py-2 text-xs">
                  <div>
                    <p className="text-[var(--text-primary)]">{edu.degree}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {edu.institution} · {edu.year}
                    </p>
                  </div>
                  <button type="button" onClick={() => deleteEducation(applicantId, edu.id)} className="text-[var(--text-muted)] hover:text-rose-400">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {applicant.education.length === 0 && (
                <p className="py-4 text-center text-[11px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا يوجد تعليم مسجل' : 'No education recorded.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connections: Employer, Agent, Recruitment Officer */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
              {language === 'ar' ? 'مكتب الاستقدام' : 'Recruitment Agency'}
            </h2>
            {agency ? (
              <div className="text-xs">
                <p className="font-medium text-[var(--text-primary)]">{tb({ en: agency.englishName, ar: agency.arabicName })}</p>
                <p className="mt-1 text-[var(--text-muted)]">{agency.phone}</p>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
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

          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
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
                    className="block rounded border border-[var(--edge-soft2)] bg-[var(--input)] p-3 text-xs hover:border-amber-500/40"
                  >
                    <p className="font-medium text-[var(--text-primary)]">
                      {employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      {language === 'ar' ? 'الموظف المسؤول' : 'Responsible officer'}: {officer ? tb(officer.name) : '—'}
                    </p>
                  </Link>
                )
              })}
              {requests.length === 0 && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا توجد طلبات استقدام مرتبطة بعد.' : 'No recruitment requests yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {expOpen && (
        <ExperienceModal
          onClose={() => setExpOpen(false)}
          onSubmit={(entry) => {
            addExperience(applicantId, entry)
            setExpOpen(false)
          }}
        />
      )}
      {eduOpen && (
        <EducationModal
          onClose={() => setEduOpen(false)}
          onSubmit={(entry) => {
            addEducation(applicantId, entry)
            setEduOpen(false)
          }}
        />
      )}
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
        <p className="text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 text-[var(--text-primary)]" dir={dir}>
          {value || '—'}
        </p>
      </div>
    )
  }

  if (editing) {
    return (
      <div>
        <p className="mb-0.5 text-[var(--text-muted)]">{label}</p>
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
          className="w-full rounded border border-amber-500/50 bg-[var(--input)] px-1.5 py-0.5 text-[11px] text-[var(--text-primary)] focus:outline-none"
        />
      </div>
    )
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-start">
      <p className="text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-[var(--text-primary)] hover:text-amber-400" dir={dir}>
        {value || '—'}
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
