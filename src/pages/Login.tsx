import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import brandLogo from '../assets/eleutheria-logo.png'

export default function Login() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const { language } = useTranslation()

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-page font-sans text-ink">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-panel border border-line bg-surface p-8 text-center">
        <img
          src={brandLogo}
          alt={`${settings.companyName} ${settings.companyTagline}`}
          width={672}
          height={180}
          className="h-14 w-auto"
        />
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
