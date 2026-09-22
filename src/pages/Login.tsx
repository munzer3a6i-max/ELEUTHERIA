import { useNavigate } from 'react-router-dom'
import { UserCog } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { ROLE_LABEL, ROLE_SUMMARY } from '../lib/permissions'
import brandLogo from '../assets/eleutheria-logo.png'

/**
 * Sign-in is still a stand-in for real authentication, but it now decides
 * something real: which member of staff is working, and therefore what the
 * app will let them do.
 */
export default function Login() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const staff = useAppStore((s) => s.staff)
  const signIn = useAppStore((s) => s.signIn)
  const { t, tb, language } = useTranslation()

  const active = staff.filter((member) => member.status === 'Active')

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-page p-4 font-sans text-ink">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-panel border border-line bg-surface p-8">
        <img
          src={brandLogo}
          alt={`${settings.companyName} ${settings.companyTagline}`}
          width={672}
          height={180}
          className="h-14 w-auto"
        />
        <p className="text-[12.5px] text-ink-2">{t('perm_sign_in_as')}</p>

        <ul className="flex w-full flex-col gap-2">
          {active.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => {
                  signIn(member.id)
                  navigate('/')
                }}
                className="flex w-full items-center gap-3 rounded-control border border-line bg-sunken px-3 py-2.5 text-start hover:border-accent-line hover:bg-raised"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-raised">
                  <UserCog className="size-4 text-ink-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{tb(member.name)}</span>
                  <span className="block truncate text-[11px] text-ink-3">{ROLE_SUMMARY[member.role][language]}</span>
                </span>
                <span className="chip chip-accent shrink-0">{ROLE_LABEL[member.role][language]}</span>
              </button>
            </li>
          ))}
          {active.length === 0 && (
            <li className="py-6 text-center text-[12px] text-ink-3">{t('acc_no_rows')}</li>
          )}
        </ul>
      </div>
    </div>
  )
}
