import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileSignature, Handshake, Pencil, Plus, Star, Trash2, Undo2 } from 'lucide-react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import { contractForAgency } from '../../lib/derivedBilling'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import {
  BilingualField,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PrimaryButton,
  SecondaryButton,
} from '../../components/form'
import type { AgencyContract, RecruitmentAgency } from '../../types'

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3 ${i < value ? 'fill-amber-400 text-accent-text' : 'text-line-strong'}`} />
      ))}
    </span>
  )
}

export default function AgenciesList() {
  const agencies = useAppStore((s) => s.agencies)
  const applicants = useAppStore((s) => s.applicants)
  const contracts = useAppStore((s) => s.agencyContracts)
  const charges = useAppStore((s) => s.agencyCharges)
  const currency = useAppStore((s) => s.settings.currency)
  const addAgency = useAppStore((s) => s.addAgency)
  const deleteAgency = useAppStore((s) => s.deleteAgency)
  const deleteAgencyContract = useAppStore((s) => s.deleteAgencyContract)
  const setAgencyChargeStatus = useAppStore((s) => s.setAgencyChargeStatus)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const { t, tb, language } = useTranslation()
  const { canEdit } = useCurrentUser()

  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contractFor, setContractFor] = useState<{ agencyId: string; contract: AgencyContract | null } | null>(null)

  const selected = agencies.find((a) => a.id === selectedId) ?? agencies[0] ?? null
  const agencyContracts = useMemo(
    () => (selected ? contracts.filter((c) => c.agencyId === selected.id) : []),
    [contracts, selected],
  )
  const agencyCharges = useMemo(
    () => (selected ? charges.filter((c) => c.agencyId === selected.id) : []),
    [charges, selected],
  )
  const expected = agencyCharges.reduce((sum, c) => sum + c.amount, 0)
  const received = agencyCharges.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0)

  function handleDelete(agency: RecruitmentAgency) {
    if (window.confirm(`${t('action_delete')} ${agency.englishName}?`)) deleteAgency(agency.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_agencies')}
        subtitle={t('page_agencies_subtitle')}
        actions={
          canEdit('operations') && (
            <PrimaryButton onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة مكتب' : 'Add Agency'}
            </PrimaryButton>
          )
        }
      />

      <Card bodyClassName="overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('label_name')}</th>
              <th>{language === 'ar' ? 'رقم الترخيص' : 'License No.'}</th>
              <th>{language === 'ar' ? 'المدير الأساسي' : 'Primary Manager'}</th>
              <th className="text-end">{language === 'ar' ? 'المتقدمون' : 'Applicants'}</th>
              <th className="text-end">{t('contract_price')}</th>
              <th>{language === 'ar' ? 'التقييم' : 'Rating'}</th>
              <th className="text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((agency) => {
              const sourced = applicants.filter((ap) => ap.recruitmentAgencyId === agency.id).length
              const contract = contractForAgency(contracts, agency.id)
              return (
                <tr
                  key={agency.id}
                  onClick={() => setSelectedId(agency.id)}
                  className={`cursor-pointer ${agency.id === selected?.id ? 'bg-accent-soft/40' : ''}`}
                >
                  <td>
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-raised">
                        <Handshake className="size-3.5 text-ink-3" />
                      </span>
                      <span className="font-medium text-ink">
                        {tb({ en: agency.englishName, ar: agency.arabicName })}
                      </span>
                    </span>
                  </td>
                  <td className="num whitespace-nowrap text-[11.5px]">{agency.licenseNumber}</td>
                  <td>{tb(agency.primaryManager)}</td>
                  <td className="num text-end text-ink">{sourced}</td>
                  <td dir="ltr" className="num whitespace-nowrap text-end">
                    {contract ? (
                      <span className="text-ink">{formatMoney(contract.pricePerWorker, currency, 0)}</span>
                    ) : (
                      <span className="text-warn">{language === 'ar' ? 'بدون عقد' : 'No contract'}</span>
                    )}
                  </td>
                  <td>
                    <Rating value={agency.rating} />
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      aria-label={t('action_delete')}
                      hidden={!canEdit('operations')}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(agency)
                      }}
                      className="text-ink-3 hover:text-neg"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {agencies.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-3">
                  {t('acc_no_rows')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card
              icon={<FileSignature className="size-3.5" />}
              title={`${t('contract_title')} · ${tb({ en: selected.englishName, ar: selected.arabicName })}`}
              subtitle={`${t('contract_half_selected')} · ${t('contract_half_visa')}`}
              action={
                canEdit('finance') && (
                  <button
                    type="button"
                    onClick={() => setContractFor({ agencyId: selected.id, contract: null })}
                    className="btn btn-secondary h-7"
                  >
                    <Plus className="size-3.5" /> {t('contract_add')}
                  </button>
                )
              }
              bodyClassName="p-0"
            >
              {agencyContracts.length === 0 ? (
                <p className="px-4 py-10 text-center text-[12px] leading-relaxed text-ink-3">{t('contract_none')}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {agencyContracts.map((contract) => (
                    <li key={contract.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="num truncate text-[12.5px] font-medium text-ink">{contract.reference}</p>
                          <p className="num mt-0.5 text-[11px] text-ink-3">
                            {contract.signedOn} → {contract.expiresOn}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span dir="ltr" className="num text-[13px] font-medium text-accent-text">
                            {formatMoney(contract.pricePerWorker, currency, 0)}
                          </span>
                          <StatusBadge status={contract.status} tone={contract.status === 'Active' ? 'pos' : 'neutral'} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-[11px] text-ink-3">{contract.notes}</p>
                        <span className="flex shrink-0 items-center gap-2" hidden={!canEdit('finance')}>
                          <button
                            type="button"
                            aria-label={t('action_edit')}
                            onClick={() => setContractFor({ agencyId: selected.id, contract })}
                            className="text-ink-3 hover:text-accent-text"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={t('action_delete')}
                            onClick={() => {
                              if (window.confirm(t('contract_delete_confirm'))) deleteAgencyContract(contract.id)
                            }}
                            className="text-ink-3 hover:text-neg"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card
              title={t('contract_charges')}
              subtitle={`${t('contract_expected')} ${formatMoney(expected, currency, 0)} · ${t('contract_received')} ${formatMoney(received, currency, 0)} · ${t('contract_awaiting')} ${formatMoney(expected - received, currency, 0)}`}
              bodyClassName="overflow-x-auto p-0"
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'العاملة' : 'Worker'}</th>
                    <th>{t('agent_milestone')}</th>
                    <th>{t('contract_due')}</th>
                    <th className="text-end">{t('label_amount')}</th>
                    <th>{t('label_status')}</th>
                    <th className="text-end">{t('label_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyCharges.map((charge) => {
                    const applicant = applicants.find((a) => a.id === charge.applicantId)
                    return (
                      <tr key={charge.id}>
                        <td>
                          {applicant ? (
                            <Link
                              to={`/applicants/${applicant.id}`}
                              className="font-medium text-ink hover:text-accent-text"
                            >
                              {language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <StatusBadge status={charge.milestone} tone={charge.milestone === 'Selected' ? 'info' : 'accent'} />
                        </td>
                        <td className="num whitespace-nowrap">{charge.dueOn}</td>
                        <td dir="ltr" className="num whitespace-nowrap text-end text-ink">
                          {formatMoney(charge.amount, currency, 0)}
                        </td>
                        <td>
                          <StatusBadge status={charge.status} />
                        </td>
                        <td className="text-end">
                          {!canEdit('finance') ? null : charge.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAgencyChargeStatus(
                                  charge.id,
                                  'Paid',
                                  paymentSources.find((p) => p.scopes.includes('Invoices'))?.id ?? null,
                                )
                              }
                              className="btn btn-secondary h-7"
                            >
                              <Check className="size-3.5" /> {t('contract_mark_settled')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAgencyChargeStatus(charge.id, 'Pending')}
                              className="btn btn-ghost h-7"
                            >
                              <Undo2 className="size-3.5" /> {t('contract_mark_pending')}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {agencyCharges.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-3">
                        {t('acc_no_rows')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {addOpen && (
        <AddAgencyModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addAgency(data)
            setAddOpen(false)
          }}
        />
      )}

      {contractFor && (
        <ContractModal
          agencyId={contractFor.agencyId}
          contract={contractFor.contract}
          onClose={() => setContractFor(null)}
        />
      )}
    </div>
  )
}

function ContractModal({
  agencyId,
  contract,
  onClose,
}: {
  agencyId: string
  contract: AgencyContract | null
  onClose: () => void
}) {
  const addAgencyContract = useAppStore((s) => s.addAgencyContract)
  const updateAgencyContract = useAppStore((s) => s.updateAgencyContract)
  const currency = useAppStore((s) => s.settings.currency)
  const { t, language } = useTranslation()

  const [reference, setReference] = useState(contract?.reference ?? '')
  const [price, setPrice] = useState(String(contract?.pricePerWorker ?? ''))
  const [signedOn, setSignedOn] = useState(contract?.signedOn ?? new Date().toISOString().slice(0, 10))
  const [expiresOn, setExpiresOn] = useState(contract?.expiresOn ?? '')
  const [status, setStatus] = useState<AgencyContract['status']>(contract?.status ?? 'Active')
  const [notes, setNotes] = useState(contract?.notes ?? '')

  const half = (Number(price) || 0) / 2

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!reference.trim() || !Number(price)) return
    const data = {
      agencyId,
      reference: reference.trim(),
      pricePerWorker: Number(price),
      signedOn,
      expiresOn,
      status,
      notes: notes.trim(),
    }
    if (contract) updateAgencyContract(contract.id, data)
    else addAgencyContract(data)
    onClose()
  }

  return (
    <Modal title={contract ? t('contract_edit') : t('contract_add')} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit}>
        <Field label={t('contract_reference')}>
          <TextInput value={reference} onChange={(e) => setReference(e.target.value)} required />
        </Field>
        <Field
          label={t('contract_price')}
          hint={`${t('contract_half_selected')}: ${formatMoney(half, currency, 0)} · ${t('contract_half_visa')}: ${formatMoney(half, currency, 0)}`}
        >
          <TextInput type="number" min="0" step="50" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('contract_signed')}>
            <TextInput type="date" value={signedOn} onChange={(e) => setSignedOn(e.target.value)} />
          </Field>
          <Field label={t('contract_expires')}>
            <TextInput type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          </Field>
        </div>
        <Field label={t('label_status')}>
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value as AgencyContract['status'])}>
            <option value="Active">{t('label_active')}</option>
            <option value="Expired">{language === 'ar' ? 'منتهٍ' : 'Expired'}</option>
          </SelectInput>
        </Field>
        <Field label={language === 'ar' ? 'ملاحظات' : 'Notes'}>
          <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{contract ? t('action_save') : t('contract_add')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}

function AddAgencyModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: Omit<RecruitmentAgency, 'id' | 'createdOn' | 'status'>) => void
}) {
  const { t, language } = useTranslation()
  const [englishName, setEnglishName] = useState('')
  const [arabicName, setArabicName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [primaryEn, setPrimaryEn] = useState('')
  const [primaryAr, setPrimaryAr] = useState('')
  const [secondEn, setSecondEn] = useState('')
  const [secondAr, setSecondAr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!englishName.trim()) return
    onSubmit({
      englishName: englishName.trim(),
      arabicName: arabicName.trim(),
      licenseNumber: licenseNumber.trim(),
      licenseExpiry,
      phone: phone.trim(),
      email: email.trim(),
      telephone: '',
      rating: 3,
      primaryManager: { en: primaryEn.trim(), ar: primaryAr.trim() },
      secondManager: { en: secondEn.trim(), ar: secondAr.trim() },
    })
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة مكتب استقدام' : 'Add Recruitment Agency'} onClose={onClose}>
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
          <Field label={language === 'ar' ? 'رقم الترخيص' : 'License Number'}>
            <TextInput value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </Field>
          <Field label={language === 'ar' ? 'انتهاء الترخيص' : 'License Expiry'}>
            <TextInput type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t('label_email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <BilingualField
          labelEn={language === 'ar' ? 'المدير الأساسي (إنجليزي)' : 'Primary Manager (English)'}
          labelAr={language === 'ar' ? 'المدير الأساسي (عربي)' : 'Primary Manager (Arabic)'}
          valueEn={primaryEn}
          valueAr={primaryAr}
          onChangeEn={setPrimaryEn}
          onChangeAr={setPrimaryAr}
        />
        <BilingualField
          labelEn={language === 'ar' ? 'المدير الثاني (إنجليزي)' : 'Second Manager (English)'}
          labelAr={language === 'ar' ? 'المدير الثاني (عربي)' : 'Second Manager (Arabic)'}
          valueEn={secondEn}
          valueAr={secondAr}
          onChangeEn={setSecondEn}
          onChangeAr={setSecondAr}
        />
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إضافة مكتب' : 'Add Agency'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
