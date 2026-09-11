import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore, currentStatus } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import SearchableSelect from '../../components/SearchableSelect'
import { Field, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { RequestType } from '../../types'

export default function RequestsList() {
  const requests = useAppStore((s) => s.requests)
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const staff = useAppStore((s) => s.staff)
  const deleteRequest = useAppStore((s) => s.deleteRequest)
  const addRequest = useAppStore((s) => s.addRequest)
  const { t, tb, language } = useTranslation()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const [typeFilter, setTypeFilter] = useState<RequestType | 'All'>('All')
  const [addOpen, setAddOpen] = useState(false)
  const query = (searchParams.get('q') ?? '').toLowerCase()

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const applicant = applicants.find((a) => a.id === r.applicantId)
      const employer = employers.find((e) => e.id === r.employerId)
      const matchesType = typeFilter === 'All' || r.type === typeFilter
      const matchesQuery =
        !query ||
        applicant?.englishName.toLowerCase().includes(query) ||
        employer?.englishName.toLowerCase().includes(query) ||
        r.mosanedNumber.toLowerCase().includes(query)
      return matchesType && matchesQuery
    })
  }, [requests, applicants, employers, typeFilter, query])

  function handleDelete(id: string) {
    if (window.confirm(t('action_delete') + '?')) deleteRequest(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_recruitments')}
        subtitle={t('page_requests_subtitle')}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> {language === 'ar' ? 'إنشاء طلب استقدام' : 'New Recruitment Request'}
          </PrimaryButton>
        }
      />

      <div className="flex items-center gap-1">
        {(['All', 'Domestic', 'Profession'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTypeFilter(s)}
            className={`rounded px-3 py-1.5 text-[11px] ${
              typeFilter === s ? 'bg-[var(--active)] text-amber-500' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {s === 'All' ? t('label_all') : s === 'Domestic' ? t('type_domestic') : t('type_profession')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--edge)] bg-[var(--surface)]">
        <table className="w-full text-start">
          <thead>
            <tr className="border-b border-[var(--edge-soft)] text-[10.5px] font-bold uppercase text-[var(--text-secondary)]">
              <th className="px-4 py-3">{language === 'ar' ? 'المتقدم' : 'Applicant'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'صاحب العمل' : 'Employer'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'النوع' : 'Type'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'الحالة الحالية' : 'Current Status'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'الموظف المسؤول' : 'Officer'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'مكتب الاستقدام' : 'Agency'}</th>
              <th className="sticky end-0 bg-[var(--surface)] px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const applicant = applicants.find((a) => a.id === r.applicantId)
              const employer = employers.find((e) => e.id === r.employerId)
              const agency = agencies.find((a) => a.id === r.recruitmentAgencyId)
              const officer = staff.find((s) => s.id === r.responsibleEmployeeId)
              const status = currentStatus(r)
              return (
                <tr key={r.id} className="border-b border-[var(--edge-soft2)] text-xs last:border-b-0 hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3">
                    <Link to={`/recruitments/${r.id}`} className="font-medium text-[var(--text-primary)] hover:text-amber-400">
                      {applicant ? (language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName) : '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {r.type === 'Domestic' ? t('type_domestic') : t('type_profession')}
                  </td>
                  <td className="px-4 py-3">
                    {status ? (
                      <span className="rounded border border-blue-500/50 bg-blue-900/60 px-2 py-0.5 text-[10px] text-blue-300">{status}</span>
                    ) : (
                      <span className="rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                        {language === 'ar' ? 'لم يبدأ' : 'Not started'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{officer ? tb(officer.name) : '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '—'}</td>
                  <td className="sticky end-0 bg-[var(--surface)] px-4 py-3 text-end">
                    <button type="button" onClick={() => handleDelete(r.id)} className="text-[var(--text-muted)] hover:text-rose-400">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا توجد طلبات مطابقة' : 'No requests match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <NewRequestModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            const id = addRequest(data)
            setAddOpen(false)
            navigate(`/recruitments/${id}`)
          }}
        />
      )}
    </div>
  )
}

function NewRequestModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: {
    type: RequestType
    contractDurationMonths: number
    applicantId: string
    employerId: string
    responsibleEmployeeId: string
    recruitmentAgencyId: string
    mosanedNumber: string
  }) => void
}) {
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const staff = useAppStore((s) => s.staff)
  const { t, language } = useTranslation()

  const [type, setType] = useState<RequestType>('Domestic')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [onlyActive, setOnlyActive] = useState(true)
  const [applicantId, setApplicantId] = useState('')
  const [employerId, setEmployerId] = useState('')
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(staff[0]?.id ?? '')
  const [recruitmentAgencyId, setRecruitmentAgencyId] = useState('')
  const [contractDurationMonths, setContractDurationMonths] = useState(24)
  const [mosanedNumber, setMosanedNumber] = useState('')

  const applicantOptions = applicants
    .filter((a) => a.type === type)
    .filter((a) => !onlyAvailable || a.status === 'Available')
    .map((a) => ({ value: a.id, label: a.englishName, sublabel: a.profession }))

  const employerOptions = employers
    .filter((e) => !onlyActive || e.status === 'Active')
    .map((e) => ({ value: e.id, label: e.englishName, sublabel: e.nationalAddressShortCode }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!applicantId || !employerId || !responsibleEmployeeId || !recruitmentAgencyId) return
    onSubmit({ type, contractDurationMonths, applicantId, employerId, responsibleEmployeeId, recruitmentAgencyId, mosanedNumber: mosanedNumber.trim() })
  }

  return (
    <Modal title={language === 'ar' ? 'إنشاء طلب استقدام' : 'New Recruitment Request'} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={language === 'ar' ? 'النوع' : 'Type'}>
            <SelectInput value={type} onChange={(e) => { setType(e.target.value as RequestType); setApplicantId('') }}>
              <option value="Domestic">{t('type_domestic')}</option>
              <option value="Profession">{t('type_profession')}</option>
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'مدة العقد (أشهر)' : 'Contract Duration (months)'}>
            <SelectInput value={contractDurationMonths} onChange={(e) => setContractDurationMonths(Number(e.target.value))}>
              {[3, 6, 12, 18, 24].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <label className="mb-1.5 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          {language === 'ar' ? 'عرض المتقدمين المتاحين فقط' : 'Show only Available applicants'}
        </label>
        <Field label={language === 'ar' ? 'المتقدم' : 'Applicant'}>
          <SearchableSelect
            options={applicantOptions}
            value={applicantId}
            onChange={setApplicantId}
            placeholder={language === 'ar' ? 'ابحث عن متقدم...' : 'Search applicant...'}
          />
        </Field>

        <label className="mb-1.5 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          {language === 'ar' ? 'عرض أصحاب العمل النشطين فقط' : 'Show only Active employers'}
        </label>
        <Field label={language === 'ar' ? 'صاحب العمل' : 'Employer'}>
          <SearchableSelect
            options={employerOptions}
            value={employerId}
            onChange={setEmployerId}
            placeholder={language === 'ar' ? 'ابحث عن صاحب عمل...' : 'Search employer...'}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={language === 'ar' ? 'الموظف المسؤول' : 'Responsible Officer'}>
            <SelectInput value={responsibleEmployeeId} onChange={(e) => setResponsibleEmployeeId(e.target.value)}>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name.en}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'مكتب الاستقدام' : 'Recruitment Agency'}>
            <SelectInput value={recruitmentAgencyId} onChange={(e) => setRecruitmentAgencyId(e.target.value)}>
              <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.englishName}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Mosaned #">
          <input
            value={mosanedNumber}
            onChange={(e) => setMosanedNumber(e.target.value)}
            placeholder="MSD-2024-00000"
            className="w-full rounded border border-[var(--edge)] bg-[var(--input)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500/60"
          />
        </Field>

        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إنشاء الطلب' : 'Create Request'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
