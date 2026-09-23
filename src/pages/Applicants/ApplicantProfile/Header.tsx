import { useRef } from 'react'
import { Camera, Globe, MoreHorizontal, User } from 'lucide-react'
import { useAppStore, currentStatus, requestCost, invoiceTotalPaid, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { useCurrentUser } from '../../../lib/useCurrentUser'
import { setPublished, setWorkerPhoto, usePhotoUrl } from '../../../lib/photos'
import type { Applicant, ApplicantStatus, RecruitmentRequest, Invoice } from '../../../types'

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-h-4 items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] text-ink-3 sm:w-28">{label}</span>
      <span className="min-w-0 truncate text-[11px] text-ink">{value}</span>
    </div>
  )
}

function MoneyLine({
  label,
  amount,
  color,
  bold,
  border,
}: {
  label: string
  amount: number
  color: string
  bold?: boolean
  border?: boolean
}) {
  return (
    <div className={`flex w-full items-center justify-between ${border ? 'border-t border-line pt-[7px]' : ''}`}>
      <span className={`text-xs ${bold ? 'font-bold' : ''}`} style={{ color: bold ? color : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className={`text-xs tracking-[0.3px] ${bold ? 'font-bold' : ''}`} style={{ color }}>
        {formatMoney(amount)}
      </span>
    </div>
  )
}

function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

const STATUS_OPTIONS: ApplicantStatus[] = ['Available', 'Unavailable', 'Selected', 'Deployed', 'Back Out']

// The control carries the same meaning as the chip beside every other status
// in the app: green is placed and well, red is a worker who pulled out.
const STATUS_TONE: Record<ApplicantStatus, string> = {
  Available: 'border-pos/40 bg-pos-soft text-pos',
  Deployed: 'border-pos/40 bg-pos-soft text-pos',
  Selected: 'border-info/40 bg-info-soft text-info',
  Unavailable: 'border-line-strong bg-raised text-ink-2',
  'Back Out': 'border-neg/40 bg-neg-soft text-neg',
}

export default function Header({
  applicant,
  activeRequest,
  invoice,
}: {
  applicant: Applicant
  activeRequest: RecruitmentRequest | null
  invoice: Invoice | null
}) {
  const setApplicantStatus = useAppStore((s) => s.setApplicantStatus)
  const employers = useAppStore((s) => s.employers)
  const { language } = useTranslation()
  const { canEdit } = useCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photo = usePhotoUrl(applicant)

  const employer = activeRequest ? employers.find((e) => e.id === activeRequest.employerId) : undefined
  const age = ageFromDob(applicant.dob)
  const totalExpenses = activeRequest ? requestCost(activeRequest) : 0
  const totalIncome = invoice ? invoiceTotalPaid(invoice) : 0
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome === 0 ? 0 : (netProfit / totalIncome) * 100

  function handleStatusChange(status: ApplicantStatus) {
    // Back Out is written as a stage on her request; that is what opens her
    // backout and lets bills be filed against it.
    if (setApplicantStatus(applicant.id, status) === 'no-request') {
      window.alert(
        language === 'ar'
          ? 'لا يوجد طلب استقدام لهذه العاملة، لذلك لا يمكن تسجيل تراجعها. أنشئ طلبًا أولًا.'
          : 'This worker has no recruitment request, so a backout cannot be opened. Create a request first.',
      )
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setWorkerPhoto(applicant, file).catch((problem: Error) => window.alert(problem.message))
  }

  function handlePublish(published: boolean) {
    // The row is what the website reads; her photograph has to follow it.
    setPublished(applicant, published).catch((problem: Error) => window.alert(problem.message))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 flex items-center gap-5 rounded-panel border border-line bg-surface p-[17px]">
        <div className="flex flex-col items-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-pill border-2 border-accent-line bg-raised p-1 shadow-md">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-pill bg-raised">
              {photo ? (
                <img src={photo} alt={applicant.englishName} className="size-full object-cover" />
              ) : (
                <User className="size-10 text-ink-3" />
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            type="button"
            hidden={!canEdit('operations')}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex items-center gap-1 rounded-control border border-line-strong bg-raised px-2.5 py-1 text-[10px] text-ink-2 shadow-sm hover:border-accent-line"
          >
            <Camera className="size-3" /> {language === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink">
              {language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName}
            </h1>
            <select
              value={applicant.status}
              disabled={!canEdit('operations')}
              onChange={(e) => handleStatusChange(e.target.value as ApplicantStatus)}
              aria-label={language === 'ar' ? 'حالة العاملة' : 'Worker status'}
              className={`rounded-control border px-2 py-0.5 text-[10px] font-bold focus:outline-none ${STATUS_TONE[applicant.status]}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-surface text-ink">
                  {s}
                </option>
              ))}
            </select>

            {/* The one switch that decides whether the public sees her. */}
            <label
              className={`flex cursor-pointer items-center gap-1.5 rounded-control border px-2 py-0.5 text-[10px] font-bold ${
                applicant.cvLinkedToWebsite
                  ? 'border-info/40 bg-info-soft text-info'
                  : 'border-line-strong bg-raised text-ink-3'
              } ${canEdit('operations') ? '' : 'pointer-events-none opacity-60'}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={applicant.cvLinkedToWebsite}
                disabled={!canEdit('operations')}
                onChange={(e) => handlePublish(e.target.checked)}
              />
              <Globe className="size-3" />
              {applicant.cvLinkedToWebsite
                ? language === 'ar' ? 'على الموقع' : 'On the website'
                : language === 'ar' ? 'غير منشورة' : 'Not on the website'}
            </label>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <MetaRow
              label={language === 'ar' ? 'رقم الملف' : 'File No.'}
              value={activeRequest?.mosanedNumber || (activeRequest ? (language === 'ar' ? 'لم يُعيّن بعد' : 'Not yet assigned') : '-')}
            />
            <MetaRow label={language === 'ar' ? 'صاحب العمل' : 'Client'} value={employer ? employer.englishName : '-'} />
            <MetaRow label={language === 'ar' ? 'الجنسية' : 'Nationality'} value={applicant.country} />
            <MetaRow
              label={language === 'ar' ? 'نوع العقد' : 'Contract Type'}
              value={activeRequest ? `${activeRequest.contractDurationMonths} ${language === 'ar' ? 'شهر' : 'months'}` : '-'}
            />
            <MetaRow label={language === 'ar' ? 'العمر' : 'Age'} value={age !== null ? `${age} ${language === 'ar' ? 'سنة' : 'yrs'}` : '-'} />
            <MetaRow
              label={language === 'ar' ? 'المرحلة الحالية' : 'Current Stage'}
              value={
                <span className="rounded-control border border-info/40 bg-info-soft px-2.5 py-0.5 text-[10px] text-info">
                  {activeRequest ? (currentStatus(activeRequest) ?? (language === 'ar' ? 'لم يبدأ' : 'Not started')) : '-'}
                </span>
              }
            />
            <MetaRow label={language === 'ar' ? 'رقم الجواز' : 'Passport No.'} value={applicant.passportNo} />
            <MetaRow label={language === 'ar' ? 'رقم الجوال' : 'Mobile No.'} value={applicant.phone || '-'} />
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col justify-between rounded-panel border border-line bg-surface p-[17px]">
        <div className="flex items-center justify-between border-b border-line pb-[9px]">
          <h2 className="text-[11px] font-semibold text-ink-3">
            {language === 'ar' ? 'الملخص المالي' : 'Financial Summary'}
          </h2>
          <button type="button" className="text-ink-3 hover:text-ink-2">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 py-2">
          <MoneyLine label={language === 'ar' ? 'إجمالي التكلفة' : 'Total Expenses'} amount={totalExpenses} color="#f43f5e" />
          <MoneyLine label={language === 'ar' ? 'إجمالي الدخل' : 'Total Income'} amount={totalIncome} color="#34d399" />
          <MoneyLine label={language === 'ar' ? 'صافي الربح' : 'Net Profit'} amount={netProfit} color="#fbbf24" bold border />
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-ink-2">{language === 'ar' ? 'هامش الربح' : 'Profit Margin'}</span>
            <span className="text-xs font-bold text-info">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>
        <div className="border-t border-line pt-[5px] text-end text-[9px] text-ink-3">
          {language === 'ar' ? 'محدث' : 'Updated'} {applicant.updatedOn} {language === 'ar' ? 'بواسطة' : 'by'} {applicant.updatedBy}
        </div>
      </div>
    </div>
  )
}
