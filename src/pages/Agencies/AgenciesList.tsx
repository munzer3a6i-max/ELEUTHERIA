import { useState } from 'react'
import { Plus, Trash2, Handshake, Star } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { BilingualField, Field, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { RecruitmentAgency } from '../../types'

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3 ${i < value ? 'fill-amber-400 text-accent-text' : 'text-[var(--edge-strong)]'}`} />
      ))}
    </span>
  )
}

export default function AgenciesList() {
  const agencies = useAppStore((s) => s.agencies)
  const applicants = useAppStore((s) => s.applicants)
  const addAgency = useAppStore((s) => s.addAgency)
  const deleteAgency = useAppStore((s) => s.deleteAgency)
  const { t, tb, language } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`${t('action_delete')} ${name}?`)) deleteAgency(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_agencies')}
        subtitle={t('page_agencies_subtitle')}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة مكتب' : 'Add Agency'}
          </PrimaryButton>
        }
      />

      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th className="px-4 py-3">{t('label_name')}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'رقم الترخيص' : 'License No.'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'المدير الأساسي' : 'Primary Manager'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'المتقدمون' : 'Applicants'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'التقييم' : 'Rating'}</th>
              <th className="sticky end-0 bg-surface px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => {
              const sourced = applicants.filter((ap) => ap.recruitmentAgencyId === a.id).length
              return (
                <tr key={a.id} className="text-xs">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-pill bg-raised">
                        <Handshake className="size-3.5 text-ink-3" />
                      </span>
                      <span className="font-medium text-ink">{tb({ en: a.englishName, ar: a.arabicName })}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{a.licenseNumber}</td>
                  <td className="px-4 py-3 text-ink-2">{tb(a.primaryManager)}</td>
                  <td className="px-4 py-3 text-ink-2">{sourced}</td>
                  <td className="px-4 py-3">
                    <Rating value={a.rating} />
                  </td>
                  <td className="sticky end-0 bg-surface px-4 py-3 text-end">
                    <button type="button" onClick={() => handleDelete(a.id, a.englishName)} className="text-ink-3 hover:text-neg">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddAgencyModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addAgency(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
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
        <div className="grid grid-cols-2 gap-3">
          <Field label={language === 'ar' ? 'رقم الترخيص' : 'License Number'}>
            <TextInput value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </Field>
          <Field label={language === 'ar' ? 'انتهاء الترخيص' : 'License Expiry'}>
            <TextInput type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
