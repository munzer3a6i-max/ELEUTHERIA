import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import PageHeader from '../components/PageHeader'
import { Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../components/form'
import type { Language, Theme } from '../types'

export default function Settings() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setTheme = useAppStore((s) => s.setTheme)
  const { t, language } = useTranslation()
  const [form, setForm] = useState({
    companyName: settings.companyName,
    companyTagline: settings.companyTagline,
    licenseNumber: settings.licenseNumber,
    address: settings.address,
  })
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateSettings(form)
    setSaved(true)
  }

  function handleReset() {
    if (window.confirm(language === 'ar' ? 'إعادة تعيين جميع البيانات إلى الوضع الافتراضي؟' : 'Reset all data to the demo defaults?')) {
      localStorage.removeItem('mustaqdem-store')
      window.location.href = '/'
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t('nav_settings')} subtitle={language === 'ar' ? 'تفضيلات النظام وملف الشركة' : 'Company profile and system preferences'} />

      <div className="max-w-lg rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
          {language === 'ar' ? 'التفضيلات' : 'Preferences'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label={language === 'ar' ? 'اللغة' : 'Language'}>
            <SelectInput value={settings.language} onChange={(e) => setLanguage(e.target.value as Language)}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'المظهر' : 'Theme'}>
            <SelectInput value={settings.theme} onChange={(e) => setTheme(e.target.value as Theme)}>
              <option value="dark">{language === 'ar' ? 'داكن' : 'Dark'}</option>
              <option value="light">{language === 'ar' ? 'فاتح' : 'Light'}</option>
            </SelectInput>
          </Field>
        </div>
      </div>

      <div className="max-w-lg rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
          {language === 'ar' ? 'ملف الشركة' : 'Company Profile'}
        </h2>
        <form onSubmit={handleSubmit}>
          <Field label={language === 'ar' ? 'اسم الشركة' : 'Company Name'}>
            <TextInput
              value={form.companyName}
              onChange={(e) => {
                setForm((f) => ({ ...f, companyName: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label={language === 'ar' ? 'الشعار' : 'Tagline'}>
            <TextInput
              value={form.companyTagline}
              onChange={(e) => {
                setForm((f) => ({ ...f, companyTagline: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label={language === 'ar' ? 'رقم الترخيص' : 'Licence Number'}>
            <TextInput
              value={form.licenseNumber}
              onChange={(e) => {
                setForm((f) => ({ ...f, licenseNumber: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label={language === 'ar' ? 'عنوان المكتب' : 'Office Address'}>
            <TextInput
              value={form.address}
              onChange={(e) => {
                setForm((f) => ({ ...f, address: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label={language === 'ar' ? 'العملة' : 'Currency'}>
            <TextInput value="USD" disabled className="opacity-60" />
          </Field>
          <div className="mt-2 flex items-center gap-3">
            <PrimaryButton type="submit">{t('action_save')}</PrimaryButton>
            {saved && <span className="text-[11px] text-emerald-400">{language === 'ar' ? 'تم الحفظ.' : 'Saved.'}</span>}
          </div>
        </form>
      </div>

      <div className="max-w-lg rounded-lg border border-rose-900/60 bg-[var(--surface)] p-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.3px] text-rose-400">
          {language === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
        </h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          {language === 'ar'
            ? 'يعيد هذا تعيين المتقدمين وأصحاب العمل ومكاتب الاستقدام والطلبات والفواتير والموظفين إلى بيانات العرض التوضيحي الأصلية.'
            : 'This resets applicants, employers, agencies, requests, invoices, and staff back to the original demo data.'}
        </p>
        <SecondaryButton onClick={handleReset} className="border-rose-900 text-rose-400 hover:border-rose-700">
          {language === 'ar' ? 'إعادة تعيين البيانات' : 'Reset Demo Data'}
        </SecondaryButton>
      </div>
    </div>
  )
}
