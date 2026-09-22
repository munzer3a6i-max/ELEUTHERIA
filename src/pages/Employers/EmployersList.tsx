import { useState } from 'react'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { BilingualField, Field, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { Employer } from '../../types'

export default function EmployersList() {
  const employers = useAppStore((s) => s.employers)
  const requests = useAppStore((s) => s.requests)
  const addEmployer = useAppStore((s) => s.addEmployer)
  const deleteEmployer = useAppStore((s) => s.deleteEmployer)
  const updateEmployer = useAppStore((s) => s.updateEmployer)
  const { t, tb, language } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`${t('action_delete')} ${name}?`)) deleteEmployer(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_employers')}
        subtitle={t('page_employers_subtitle')}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة صاحب عمل' : 'Add Employer'}
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employers.map((e) => {
          const activeWorkers = requests.filter((r) => r.employerId === e.id).length
          return (
            <div key={e.id} className="rounded-panel border border-line bg-surface p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center overflow-hidden rounded-pill bg-raised">
                    {e.profileImageDataUrl ? (
                      <img src={e.profileImageDataUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <Building2 className="size-4 text-ink-3" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{tb({ en: e.englishName, ar: e.arabicName })}</p>
                    <p className="text-[11px] text-ink-3">{e.nationalAddressShortCode}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(e.id, e.englishName)} className="text-ink-3 hover:text-neg">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-ink-2">
                <p>{e.email}</p>
                <p>{e.phone}</p>
                <p>{e.nationalAddress}</p>
                <p>{language === 'ar' ? 'رقم الهوية الوطنية' : 'National ID'}: {e.nationalIdNumber}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => updateEmployer(e.id, { status: e.status === 'Active' ? 'Inactive' : 'Active' })}
                  className={`rounded-control px-2 py-0.5 text-[10px] font-bold ${
                    e.status === 'Active' ? 'bg-pos-soft text-pos' : 'bg-raised text-ink-3'
                  }`}
                >
                  {e.status === 'Active' ? t('label_active') : t('label_inactive')}
                </button>
                <span className="text-ink-2">
                  {activeWorkers} {language === 'ar' ? 'استقدام' : 'requests'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {addOpen && (
        <AddEmployerModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addEmployer(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddEmployerModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: Omit<Employer, 'id' | 'createdOn' | 'status' | 'profileImageDataUrl'>) => void
}) {
  const { t, language } = useTranslation()
  const [englishName, setEnglishName] = useState('')
  const [arabicName, setArabicName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [telephone, setTelephone] = useState('')
  const [nationalAddress, setNationalAddress] = useState('')
  const [nationalIdNumber, setNationalIdNumber] = useState('')
  const [nationalAddressShortCode, setNationalAddressShortCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!englishName.trim()) return
    onSubmit({
      englishName: englishName.trim(),
      arabicName: arabicName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      telephone: telephone.trim(),
      nationalAddress: nationalAddress.trim(),
      nationalIdNumber: nationalIdNumber.trim(),
      nationalAddressShortCode: nationalAddressShortCode.trim().toUpperCase(),
    })
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة صاحب عمل' : 'Add Employer'} onClose={onClose}>
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
          <Field label={t('label_email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" />
          </Field>
        </div>
        <Field label={language === 'ar' ? 'الهاتف الأرضي' : 'Telephone'}>
          <TextInput value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </Field>
        <Field label={language === 'ar' ? 'العنوان الوطني' : 'National Address'}>
          <TextInput value={nationalAddress} onChange={(e) => setNationalAddress(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'رقم الهوية الوطنية' : 'National ID Number'}>
            <TextInput value={nationalIdNumber} onChange={(e) => setNationalIdNumber(e.target.value)} />
          </Field>
          <Field label={language === 'ar' ? 'الرمز المختصر للعنوان' : 'Short Code'}>
            <TextInput value={nationalAddressShortCode} onChange={(e) => setNationalAddressShortCode(e.target.value)} maxLength={8} placeholder="RAHA1234" />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إضافة صاحب عمل' : 'Add Employer'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
