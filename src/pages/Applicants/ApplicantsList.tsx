import { useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, User } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { BilingualField, Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { ApplicantStatus, RequestType, Gender } from '../../types'

const STATUS_FILTERS: (ApplicantStatus | 'All')[] = ['All', 'Available', 'Unavailable', 'Selected', 'Deployed', 'Back Out']
const TYPE_FILTERS: (RequestType | 'All')[] = ['All', 'Domestic', 'Profession']

export default function ApplicantsList() {
  const applicants = useAppStore((s) => s.applicants)
  const professions = useAppStore((s) => s.professions)
  const countries = useAppStore((s) => s.countries)
  const agencies = useAppStore((s) => s.agencies)
  const addApplicant = useAppStore((s) => s.addApplicant)
  const deleteApplicant = useAppStore((s) => s.deleteApplicant)
  const { t, tb, language } = useTranslation()
  const { canEdit } = useCurrentUser()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'All'>('All')
  const [typeFilter, setTypeFilter] = useState<RequestType | 'All'>('All')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      const matchesQuery =
        !query ||
        a.englishName.toLowerCase().includes(query.toLowerCase()) ||
        a.arabicName.includes(query) ||
        a.passportNo.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter
      const matchesType = typeFilter === 'All' || a.type === typeFilter
      return matchesQuery && matchesStatus && matchesType
    })
  }, [applicants, query, statusFilter, typeFilter])

  function handleDelete(id: string, name: string) {
    if (window.confirm(`${t('action_delete')} ${name}?`)) deleteApplicant(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_applicants')}
        subtitle={`${applicants.length} ${language === 'ar' ? 'متقدم' : 'applicants'}`}
        actions={
          canEdit('operations') && (
            <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة متقدم' : 'Add Applicant'}
            </PrimaryButton>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
            placeholder={language === 'ar' ? 'ابحث بالاسم أو رقم الجواز...' : 'Search by name or passport no...'}
            className="w-full rounded-control border border-line bg-sunken py-2 ps-8 pe-3 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-focus"
          />
          <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {TYPE_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTypeFilter(s)}
              className={`rounded-control px-2.5 py-1.5 text-[11px] ${
                typeFilter === s ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-raised'
              }`}
            >
              {s === 'All' ? t('label_all') : s === 'Domestic' ? t('type_domestic') : t('type_profession')}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-control px-2.5 py-1.5 text-[11px] ${
                statusFilter === s ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-raised'
              }`}
            >
              {s === 'All' ? t('label_all') : s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th className="px-4 py-3">{t('label_name')}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'المهنة' : 'Profession'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'النوع' : 'Type'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'مكتب الاستقدام' : 'Agency'}</th>
              <th className="px-4 py-3">{t('label_status')}</th>
              <th className="sticky end-0 bg-surface px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const agency = agencies.find((ag) => ag.id === a.recruitmentAgencyId)
              return (
                <tr key={a.id} className="text-xs">
                  <td className="px-4 py-3">
                    <Link to={`/applicants/${a.id}`} className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center overflow-hidden rounded-pill bg-raised">
                        {a.photoDataUrl ? (
                          <img src={a.photoDataUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <User className="size-4 text-ink-3" />
                        )}
                      </span>
                      <span className="font-medium text-ink hover:text-accent-text">
                        {language === 'ar' ? a.arabicName || a.englishName : a.englishName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{a.profession}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {a.type === 'Domestic' ? t('type_domestic') : t('type_profession')}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="sticky end-0 bg-surface px-4 py-3 text-end">
                    <button
                      type="button"
                      hidden={!canEdit('operations')}
                      onClick={() => handleDelete(a.id, a.englishName)}
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
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-ink-3">
                  {language === 'ar' ? 'لا يوجد متقدمون مطابقون' : 'No applicants match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddApplicantModal
          professions={professions.map((p) => p.name.en)}
          countries={countries.map((c) => c.name.en)}
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            const id = addApplicant(data)
            setAddOpen(false)
            navigate(`/applicants/${id}`)
          }}
        />
      )}
    </div>
  )
}

function AddApplicantModal({
  professions,
  countries,
  onClose,
  onSubmit,
}: {
  professions: string[]
  countries: string[]
  onClose: () => void
  onSubmit: (data: {
    englishName: string
    arabicName: string
    gender: Gender
    dob: string
    country: string
    profession: string
    type: RequestType
    experienceYears: number
    passportNo: string
    passportStart: string
    passportEnd: string
    idNumber: string
    phone: string
    telephone: string
    recruitmentAgencyId: string | null
    agentId: string | null
  }) => void
}) {
  const agencies = useAppStore((s) => s.agencies)
  const agents = useAppStore((s) => s.agents)
  const { t, tb, language } = useTranslation()
  const [englishName, setEnglishName] = useState('')
  const [arabicName, setArabicName] = useState('')
  const [gender, setGender] = useState<Gender>('Female')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState(countries[0] ?? 'Philippines')
  const [profession, setProfession] = useState(professions[0] ?? '')
  const [type, setType] = useState<RequestType>('Domestic')
  const [passportNo, setPassportNo] = useState('')
  const [passportStart, setPassportStart] = useState('')
  const [passportEnd, setPassportEnd] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [agentId, setAgentId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!englishName.trim() || !passportNo.trim()) return
    onSubmit({
      englishName: englishName.trim(),
      arabicName: arabicName.trim(),
      gender,
      dob,
      country,
      profession,
      type,
      experienceYears: 0,
      passportNo: passportNo.trim(),
      passportStart,
      passportEnd,
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      telephone: '',
      recruitmentAgencyId: agencyId || null,
      agentId: agentId || null,
    })
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة متقدم' : 'Add Applicant'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={t('label_english_name')}
          labelAr={t('label_arabic_name')}
          valueEn={englishName}
          valueAr={arabicName}
          onChangeEn={setEnglishName}
          onChangeAr={setArabicName}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'الجنس' : 'Gender'}>
            <SelectInput value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option>Female</option>
              <option>Male</option>
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}>
            <TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'الدولة' : 'Country'}>
            <SelectInput value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'المهنة' : 'Profession'}>
            <SelectInput value={profession} onChange={(e) => setProfession(e.target.value)}>
              {professions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label={language === 'ar' ? 'نوع الطلب' : 'Type'}>
          <SelectInput value={type} onChange={(e) => setType(e.target.value as RequestType)}>
            <option value="Domestic">{t('type_domestic')}</option>
            <option value="Profession">{t('type_profession')}</option>
          </SelectInput>
        </Field>
        <Field label={language === 'ar' ? 'رقم الجواز' : 'Passport No.'}>
          <TextInput value={passportNo} onChange={(e) => setPassportNo(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'بداية الجواز' : 'Passport Start'}>
            <TextInput type="date" value={passportStart} onChange={(e) => setPassportStart(e.target.value)} />
          </Field>
          <Field label={language === 'ar' ? 'نهاية الجواز' : 'Passport End'}>
            <TextInput type="date" value={passportEnd} onChange={(e) => setPassportEnd(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'رقم الهوية' : 'ID Number'}>
            <TextInput value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          </Field>
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9xx xxx xxxx" />
          </Field>
        </div>
        <Field label={language === 'ar' ? 'مكتب الاستقدام (اختياري)' : 'Recruitment Agency (optional)'}>
          <SelectInput value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
            <option value="">{language === 'ar' ? 'بدون' : 'None'}</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {tb({ en: a.englishName, ar: a.arabicName })}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={language === 'ar' ? 'الوكيل (اختياري)' : 'Introduced by agent (optional)'}>
          <SelectInput value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">{language === 'ar' ? 'جاءت مباشرة' : 'Came to us directly'}</option>
            {agents
              .filter((a) => a.status === 'Active')
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {tb(a.name)}
                </option>
              ))}
          </SelectInput>
          <p className="mt-1 text-[10.5px] text-ink-3">
            {language === 'ar'
              ? 'يستحق الوكيل نصف أتعابه عند الاختيار والنصف الآخر عند المغادرة.'
              : 'An agent earns half their fee at selection and the other half at deployment.'}
          </p>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إضافة متقدم' : 'Add Applicant'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
