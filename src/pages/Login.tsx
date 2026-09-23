import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, KeyRound, TriangleAlert, User } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { signIn } from '../data/session'
import { configurationProblem, isSupabaseConfigured } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import { DEFAULT_PASSWORD } from '../lib/passwords'
import { exportLocalData } from '../lib/connection'
import { Field, TextInput, PrimaryButton } from '../components/form'
import brandLogo from '../assets/eleutheria-logo.png'

export default function Login() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const anyChanged = useAppStore((s) => s.staff.some((m) => m.credentials && !m.credentials.temporary))
  const { t, language } = useTranslation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Configuring a project moves the accounts to the server, which would
  // otherwise put whatever this browser still holds out of reach -- and that
  // is exactly the moment somebody needs to export it.
  const localData = useMemo(() => {
    try {
      const raw = localStorage.getItem('mustaqdem-store')
      return raw ? (JSON.parse(raw).state?.applicants?.length ?? 0) : 0
    } catch {
      return 0
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    // One message for a wrong name and a wrong password: saying which is wrong
    // tells a stranger which half they got right.
    const outcome = await signIn(username, password)
    setBusy(false)
    if (outcome === 'ok') navigate('/')
    else if (outcome === 'inactive') setError(t('auth_inactive'))
    else if (outcome === 'unlinked') setError(t('auth_unlinked'))
    else if (outcome === 'unreachable') setError(t('auth_unreachable'))
    else setError(t('auth_wrong'))
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-page p-4 font-sans text-ink">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-1 rounded-panel border border-line bg-surface p-8"
      >
        <img
          src={brandLogo}
          alt={`${settings.companyName} ${settings.companyTagline}`}
          width={672}
          height={180}
          className="mx-auto mb-5 h-12 w-auto"
        />

        <Field label={isSupabaseConfigured ? t('auth_email') : t('auth_username')}>
          <span className="relative block">
            <User className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            <TextInput
              type={isSupabaseConfigured ? 'email' : 'text'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="ps-8"
            />
          </span>
        </Field>

        <Field label={t('auth_password')}>
          <span className="relative block">
            <KeyRound className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="ps-8"
            />
          </span>
        </Field>

        {error && (
          <p className="mb-3 flex items-start gap-1.5 text-[11.5px] font-medium text-neg">
            <TriangleAlert className="mt-px size-3.5 shrink-0" /> {error}
          </p>
        )}

        <PrimaryButton type="submit" disabled={busy} className="mt-1 h-9 w-full">
          {t('auth_sign_in')}
        </PrimaryButton>

        {isSupabaseConfigured && localData > 0 && (
          <button
            type="button"
            onClick={exportLocalData}
            className="btn btn-ghost mt-4 h-8 w-full text-[11px] text-ink-3"
          >
            <Download className="size-3.5" />
            {t('db_export')} ({localData} {t('nav_applicants').toLowerCase()})
          </button>
        )}

        {configurationProblem && (
          <p className="mt-4 flex items-start gap-1.5 rounded-control border border-line bg-sunken p-2.5 text-[10.5px] leading-relaxed text-ink-3">
            <TriangleAlert className="mt-px size-3.5 shrink-0 text-neg" />
            {t(configurationProblem === 'bad-url' ? 'auth_bad_url' : 'auth_missing_key')}
          </p>
        )}

        {!anyChanged && !isSupabaseConfigured && (
          <p className="mt-4 rounded-control border border-line bg-sunken p-2.5 text-[10.5px] leading-relaxed text-ink-3">
            {language === 'ar'
              ? `لم يُغيّر أحد كلمة المرور بعد. ابدأ باسم المستخدم kylie وكلمة المرور ${DEFAULT_PASSWORD}، ثم غيّرها من صفحة حسابي.`
              : `Nobody has changed a password yet. Start with the username kylie and the password ${DEFAULT_PASSWORD}, then change it from My Account.`}
          </p>
        )}
      </form>
    </div>
  )
}
