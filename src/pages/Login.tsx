import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'

export default function Login() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const { language } = useTranslation()

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-page font-sans text-ink">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-panel border border-line bg-surface p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-pill border border-accent-line bg-accent-soft">
          <ShieldCheck className="size-8 text-accent-text" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-lg font-semibold uppercase tracking-[0.08em] text-accent-text">{settings.companyName}</p>
          <p className="text-[10px] text-ink-3">{settings.companyTagline}</p>
        </div>
        <p className="text-sm text-ink-2">
          {language === 'ar' ? 'لقد تم تسجيل خروجك.' : 'You have been logged out.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-primary w-full"
        >
          {language === 'ar' ? 'تسجيل الدخول مرة أخرى' : 'Log Back In'}
        </button>
      </div>
    </div>
  )
}
