import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { fetchLiveRate } from '../../lib/pesoRate'
import { useTranslation } from '../../i18n/useTranslation'
import { Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { Language, Theme } from '../../types'

export default function CompanyTab() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setTheme = useAppStore((s) => s.setTheme)
  const pesoLive = useAppStore((s) => s.pesoLive)
  const setPesoLive = useAppStore((s) => s.setPesoLive)
  const [refreshing, setRefreshing] = useState(false)
  const [rateProblem, setRateProblem] = useState<string | null>(null)
  const { t, language } = useTranslation()
  const [form, setForm] = useState({
    companyName: settings.companyName,
    companyTagline: settings.companyTagline,
    licenseNumber: settings.licenseNumber,
    address: settings.address,
    website: settings.website,
    phones: settings.phones,
    email: settings.email,
    pesoRate: String(settings.pesoRate),
    pesoRateLive: settings.pesoRateLive !== false,
  })
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateSettings({ ...form, pesoRate: Number(form.pesoRate) || settings.pesoRate })
    setSaved(true)
  }

  async function refreshRate() {
    setRefreshing(true)
    setRateProblem(null)
    try {
      setPesoLive(await fetchLiveRate())
    } catch (problem) {
      setRateProblem(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setRefreshing(false)
    }
  }

  function handleReset() {
    if (window.confirm(language === 'ar' ? 'إعادة تعيين جميع البيانات إلى الوضع الافتراضي؟' : 'Reset all data to the demo defaults?')) {
      localStorage.removeItem('mustaqdem-store')
      window.location.href = '/'
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-lg rounded-panel border border-line bg-surface p-5">
        <h2 className="mb-4 panel-title">
          {language === 'ar' ? 'التفضيلات' : 'Preferences'}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <div className="max-w-lg rounded-panel border border-line bg-surface p-5">
        <h2 className="mb-4 panel-title">
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
          <Field label={language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}>
            <TextInput
              value={form.website}
              onChange={(e) => {
                setForm((f) => ({ ...f, website: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <div className="mb-3 rounded-control border border-line bg-sunken p-3">
            <label className="flex items-center gap-2 text-[12px] font-medium text-ink">
              <input
                type="checkbox"
                checked={form.pesoRateLive}
                onChange={(e) => {
                  setForm((f) => ({ ...f, pesoRateLive: e.target.checked }))
                  setSaved(false)
                }}
                className="accent-accent"
              />
              {language === 'ar' ? 'استخدام سعر البيزو المباشر من البنك' : 'Use the live peso rate from the bank'}
            </label>
            <p className="mt-1 text-[10.5px] leading-relaxed text-ink-3">
              {language === 'ar'
                ? 'سعر البنك المركزي الأوروبي المرجعي اليومي، يُحدَّث تلقائيًا. لا يحتاج إلى مفتاح.'
                : 'The European Central Bank’s daily reference rate, refreshed by itself through the day. No key or account needed.'}
            </p>
            {form.pesoRateLive && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                <p className="text-[11.5px] text-ink-2">
                  {pesoLive ? (
                    <>
                      <span className="num font-semibold text-ink">₱{pesoLive.rate.toFixed(4)}</span> per $1 · {pesoLive.source}
                      {pesoLive.date && ` · ${pesoLive.date}`}
                    </>
                  ) : language === 'ar' ? (
                    'لم يُجلب السعر المباشر بعد؛ يُستخدم السعر المحفوظ أدناه.'
                  ) : (
                    'No live rate yet; the saved rate below is used.'
                  )}
                </p>
                <button type="button" onClick={refreshRate} disabled={refreshing} className="btn btn-ghost h-7 px-2 text-accent-text">
                  <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  {language === 'ar' ? 'تحديث' : 'Refresh'}
                </button>
              </div>
            )}
            {rateProblem && <p className="mt-1.5 text-[11px] font-medium text-neg">{rateProblem} {language === 'ar' ? 'يُستخدم السعر المحفوظ.' : 'The saved rate is used meanwhile.'}</p>}
          </div>
          <Field
            label={
              form.pesoRateLive
                ? language === 'ar'
                  ? 'السعر الاحتياطي (بيزو لكل دولار)'
                  : 'Fallback rate (pesos per dollar)'
                : t('settings_peso_rate')
            }
          >
            <TextInput
              type="number"
              // Any rate at all, to as many places as the bank quotes: a step
              // counted from a minimum once made 56.5 "invalid", and the
              // browser then quietly refused to save the whole form.
              min={0}
              step="any"
              value={form.pesoRate}
              onChange={(e) => {
                setForm((f) => ({ ...f, pesoRate: e.target.value }))
                setSaved(false)
              }}
            />
            <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
              {form.pesoRateLive
                ? language === 'ar'
                  ? 'يُستخدم فقط عندما يتعذّر الوصول إلى السعر المباشر.'
                  : 'Used only when the live rate cannot be reached.'
                : t('settings_peso_rate_hint')}
            </p>
          </Field>
          <Field label={language === 'ar' ? 'أرقام التواصل' : 'Contact Numbers'}>
            <TextInput
              value={form.phones}
              onChange={(e) => {
                setForm((f) => ({ ...f, phones: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}>
            <TextInput
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <p className="text-[10.5px] leading-relaxed text-ink-3">
            {language === 'ar'
              ? 'تظهر هذه الثلاثة في أعلى السيرة الذاتية وفي أسفلها، بالصيغة نفسها التي تكتبها هنا.'
              : 'These three are what the CV prints at the top of the page and in its footer, exactly as they are written here.'}
          </p>
          <Field label={language === 'ar' ? 'العملة' : 'Currency'}>
            <TextInput value="USD" disabled className="opacity-60" />
          </Field>
          <div className="mt-2 flex items-center gap-3">
            <PrimaryButton type="submit">{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</PrimaryButton>
            {saved && <span className="text-[11px] text-pos">{language === 'ar' ? 'تم الحفظ.' : 'Saved.'}</span>}
          </div>
        </form>
      </div>

      <div className="max-w-lg rounded-panel border border-neg/40 bg-surface p-5">
        <h2 className="mb-2 panel-title text-neg">
          {language === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
        </h2>
        <p className="mb-3 text-xs text-ink-3">
          {language === 'ar'
            ? 'يعيد هذا تعيين المتقدمين وأصحاب العمل ومكاتب الاستقدام والطلبات والفواتير والموظفين إلى بيانات العرض التوضيحي الأصلية.'
            : 'This resets applicants, employers, agencies, requests, invoices, and staff back to the original demo data.'}
        </p>
        <SecondaryButton onClick={handleReset} className="border-neg/40 text-neg hover:border-neg">
          {language === 'ar' ? 'إعادة تعيين البيانات' : 'Reset Demo Data'}
        </SecondaryButton>
      </div>
    </div>
  )
}
