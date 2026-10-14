import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore, currentStatus, useStatusDefinitions } from '../../store/useAppStore'
import { placementOwnerId } from '../../data/businessRules'
import { openPlacements } from '../../data/statusPipelines'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
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
  const deleteRequest = useAppStore((s) => s.deleteRequest)
  const addRequest = useAppStore((s) => s.addRequest)
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const managers = useAppStore((s) => s.managers)
  const { t, tb, language } = useTranslation()
  const { canEdit } = useCurrentUser()
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
          canEdit('placements') && (
            <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> {language === 'ar' ? 'إنشاء طلب استقدام' : 'New Recruitment Request'}
            </PrimaryButton>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-1">
        {(['All', 'Domestic', 'Profession'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTypeFilter(s)}
            className={`rounded-control px-3 py-1.5 text-[11px] ${
              typeFilter === s ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-raised'
            }`}
          >
            {s === 'All' ? t('label_all') : s === 'Domestic' ? t('type_domestic') : t('type_profession')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th className="px-4 py-3">{language === 'ar' ? 'المتقدم' : 'Applicant'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'صاحب العمل' : 'Employer'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'النوع' : 'Type'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'الحالة الحالية' : 'Current Status'}</th>
              <th className="px-4 py-3">{t('label_owner')}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'المصدر' : 'Source'}</th>
              <th className="sticky end-0 bg-surface px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const applicant = applicants.find((a) => a.id === r.applicantId)
              const employer = employers.find((e) => e.id === r.employerId)
              const agency = agencies.find((a) => a.id === r.recruitmentAgencyId)
              const owner = managers.find((m) => m.id === placementOwnerId(r.type, applicant?.managerId ?? null))
              const status = currentStatus(r)
              return (
                <tr key={r.id} className="text-xs">
                  <td className="px-4 py-3">
                    <Link to={`/recruitments/${r.id}`} className="font-medium text-ink hover:text-accent-text">
                      {applicant ? (language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName) : '-'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {r.type === 'Domestic' ? t('type_domestic') : t('type_profession')}
                  </td>
                  <td className="px-4 py-3">
                    {status ? (
                      <span className="rounded-control border border-info/40 bg-info-soft px-2 py-0.5 text-[10px] text-info">{status}</span>
                    ) : (
                      <span className="rounded-control border border-line-strong bg-raised px-2 py-0.5 text-[10px] text-ink-3">
                        {language === 'ar' ? 'لم يبدأ' : 'Not started'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{owner ? tb(owner.name) : t('label_owner_office')}</td>
                  {/* Where she came from. A domestic worker comes through a partner
                      office; a tradesman is hired direct, so the column names the
                      employer who asked for him rather than sitting empty. */}
                  <td className="px-4 py-3 text-ink-2">
                    {r.type === 'Domestic'
                      ? agency
                        ? tb({ en: agency.englishName, ar: agency.arabicName })
                        : '-'
                      : employer
                        ? tb({ en: employer.englishName, ar: employer.arabicName })
                        : '-'}
                  </td>
                  <td className="sticky end-0 bg-surface px-4 py-3 text-end">
                    <button
                      type="button"
                      hidden={!canEdit('placements')}
                      onClick={() => handleDelete(r.id)}
                      className="text-ink-3 hover:text-neg"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-ink-3">
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
          onSubmit={({ managerId, ...data }) => {
            const id = addRequest(data)
            // A tradesman's partner is a fact about him, not about this one
            // placement, so it is kept on his record -- which is where the
            // month-end split reads it from.
            const applicant = applicants.find((a) => a.id === data.applicantId)
            if (data.type === 'Profession' && applicant && (applicant.managerId ?? '') !== managerId) {
              updateApplicant(data.applicantId, { managerId: managerId || null })
            }
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
    /** The partner this placement belongs to; empty is the office. */
    managerId: string
  }) => void
}) {
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const managers = useAppStore((s) => s.managers)
  const staff = useAppStore((s) => s.staff)
  const requests = useAppStore((s) => s.requests)
  const definitions = useStatusDefinitions()
  const { member } = useCurrentUser()
  const { t, tb, language } = useTranslation()

  const [type, setType] = useState<RequestType>('Domestic')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [onlyActive, setOnlyActive] = useState(true)
  const [applicantId, setApplicantId] = useState('')
  const [employerId, setEmployerId] = useState('')
  const [managerId, setManagerId] = useState('')
  // Whoever is signed in is the one raising it; nobody picks that from a list.
  const responsibleEmployeeId = member?.id ?? staff[0]?.id ?? ''
  const [recruitmentAgencyId, setRecruitmentAgencyId] = useState('')
  const [contractDurationMonths, setContractDurationMonths] = useState(24)
  const [mosanedNumber, setMosanedNumber] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  // The partner office and the Mosaned number are both parts of the domestic
  // route: a tradesman is hired direct, and neither is asked for or kept.
  const domestic = type === 'Domestic'

  /** Her own record already names the office she came through, so picking her fills it in. */
  function chooseApplicant(id: string) {
    setApplicantId(id)
    const applicant = applicants.find((a) => a.id === id)
    setRecruitmentAgencyId(applicant?.recruitmentAgencyId ?? '')
    setManagerId(applicant?.managerId ?? '')
  }

  // Who can be placed: everyone of this type who is not already on a running
  // placement. It used to go by her status field, which left out anybody whose
  // status had been set to something else by hand -- or by a placement that
  // has since ended -- even though nothing was pending for her.
  const applicantOptions = applicants
    .filter((a) => a.type === type)
    .filter((a) => !onlyAvailable || openPlacements(a.id, requests, definitions).length === 0)
    .map((a) => ({ value: a.id, label: a.englishName, sublabel: a.profession }))

  const employerOptions = employers
    .filter((e) => !onlyActive || e.status === 'Active')
    .map((e) => ({ value: e.id, label: e.englishName, sublabel: e.nationalAddressShortCode }))

  // A request needs the three parties it is between. The partner office is not
  // one of them: plenty of workers are sourced by the office itself, and a
  // placement without one is a real placement -- it simply bills nobody. What
  // is missing is said out loud either way, because a button that quietly does
  // nothing looks like a broken system.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const missing = [
      !applicantId && (language === 'ar' ? 'المتقدم' : 'the applicant'),
      !employerId && (language === 'ar' ? 'صاحب العمل' : 'the employer'),
    ].filter(Boolean) as string[]
    // One running placement per worker. A second request for somebody already
    // on one would be the same placement typed twice.
    if (applicantId && openPlacements(applicantId, requests, definitions).length > 0) {
      setProblem(
        language === 'ar'
          ? 'هذه المرشحة على طلب استقدام جارٍ بالفعل. افتح ذلك الطلب بدلًا من إنشاء آخر.'
          : 'This worker is already on a running placement. Open that one instead of raising a second.',
      )
      return
    }
    if (missing.length > 0) {
      setProblem(
        language === 'ar'
          ? `يلزم اختيار ${missing.join(' و')} قبل إنشاء الطلب.`
          : `Choose ${missing.join(' and ')} before creating the request.`,
      )
      return
    }
    setProblem(null)
    onSubmit({
      type,
      contractDurationMonths,
      applicantId,
      employerId,
      responsibleEmployeeId,
      recruitmentAgencyId: domestic ? recruitmentAgencyId : '',
      mosanedNumber: domestic ? mosanedNumber.trim() : '',
      managerId: domestic ? '' : managerId,
    })
  }

  return (
    <Modal title={language === 'ar' ? 'إنشاء طلب استقدام' : 'New Recruitment Request'} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'النوع' : 'Type'}>
            <SelectInput value={type} onChange={(e) => { setType(e.target.value as RequestType); chooseApplicant('') }}>
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

        <label className="mb-1.5 flex items-center gap-2 text-[11px] text-ink-2">
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          {language === 'ar' ? 'إخفاء من هم على طلب استقدام جارٍ' : 'Hide applicants already on a placement'}
        </label>
        <Field label={language === 'ar' ? 'المتقدم' : 'Applicant'}>
          <SearchableSelect
            options={applicantOptions}
            value={applicantId}
            onChange={chooseApplicant}
            placeholder={language === 'ar' ? 'ابحث عن متقدم...' : 'Search applicant...'}
          />
        </Field>

        <label className="mb-1.5 flex items-center gap-2 text-[11px] text-ink-2">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_owner')}>
            {domestic ? (
              <p className="rounded-control border border-line bg-sunken px-3 py-2 text-xs text-ink">
                {t('label_owner_office')}
              </p>
            ) : (
              <SelectInput value={managerId} onChange={(e) => setManagerId(e.target.value)}>
                <option value="">{t('label_owner_office')}</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {tb(m.name)}
                  </option>
                ))}
              </SelectInput>
            )}
            <p className="mt-1 text-[10px] text-ink-3">
              {domestic ? t('label_owner_office_note') : t('label_owner_partner_note')}
            </p>
          </Field>
          {domestic && (
          <Field label={language === 'ar' ? 'مكتب الاستقدام' : 'Recruitment Agency'}>
            <SelectInput value={recruitmentAgencyId} onChange={(e) => setRecruitmentAgencyId(e.target.value)}>
              <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.englishName}
                </option>
              ))}
            </SelectInput>
            {!recruitmentAgencyId && (
              <p className="mt-1 text-[10px] text-ink-3">
                {language === 'ar'
                  ? 'اختياري. بدون مكتب شريك لا تُحتسب عليه أي مستحقات لهذا التوظيف.'
                  : 'Optional. With no partner office, nothing is billed to one for this placement.'}
              </p>
            )}
          </Field>
          )}
        </div>
        {domestic && (
          <Field label="Mosaned #">
            <input
              value={mosanedNumber}
              onChange={(e) => setMosanedNumber(e.target.value)}
              placeholder="MSD-2024-00000"
              className="w-full rounded-control border border-line bg-sunken px-3 py-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-focus"
            />
          </Field>
        )}

        {problem && <p className="mt-2 text-[11px] font-medium text-neg">{problem}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إنشاء الطلب' : 'Create Request'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
