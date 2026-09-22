import { useRef } from 'react'
import { Camera, MoreHorizontal, User } from 'lucide-react'
import { useAppStore, currentStatus, requestCost, invoiceTotalPaid, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
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

const STATUS_OPTIONS: ApplicantStatus[] = ['Available', 'Unavailable', 'Selected', 'Deployed']

export default function Header({
  applicant,
  activeRequest,
  invoice,
}: {
  applicant: Applicant
  activeRequest: RecruitmentRequest | null
  invoice: Invoice | null
}) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const employers = useAppStore((s) => s.employers)
  const { language } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const employer = activeRequest ? employers.find((e) => e.id === activeRequest.employerId) : undefined
  const age = ageFromDob(applicant.dob)
  const totalExpenses = activeRequest ? requestCost(activeRequest) : 0
  const totalIncome = invoice ? invoiceTotalPaid(invoice) : 0
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome === 0 ? 0 : (netProfit / totalIncome) * 100

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateApplicant(applicant.id, { photoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 flex items-center gap-5 rounded-panel border border-line bg-surface p-[17px]">
        <div className="flex flex-col items-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-pill border-2 border-accent-line bg-raised p-1 shadow-md">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-pill bg-raised">
              {applicant.photoDataUrl ? (
                <img src={applicant.photoDataUrl} alt={applicant.englishName} className="size-full object-cover" />
              ) : (
                <User className="size-10 text-ink-3" />
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            type="button"
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
              onChange={(e) => updateApplicant(applicant.id, { status: e.target.value as ApplicantStatus })}
              className="rounded-control border border-pos/40 bg-pos-soft px-2 py-0.5 text-[10px] font-bold text-pos focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-surface text-ink">
                  {s}
                </option>
              ))}
            </select>
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
