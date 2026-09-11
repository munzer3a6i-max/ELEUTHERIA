import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'

export default function Login() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const { language } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--page)] font-sans text-[var(--text-primary)]">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
          <ShieldCheck className="size-8 text-amber-500" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-serif text-lg font-bold uppercase tracking-[1.3px] text-amber-500">{settings.companyName}</p>
          <p className="text-[10px] uppercase tracking-[0.4px] text-[var(--text-muted)]">{settings.companyTagline}</p>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {language === 'ar' ? 'لقد تم تسجيل خروجك.' : 'You have been logged out.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full rounded bg-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-500"
        >
          {language === 'ar' ? 'تسجيل الدخول مرة أخرى' : 'Log Back In'}
        </button>
      </div>
    </div>
  )
}
