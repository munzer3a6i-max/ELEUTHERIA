import { Bell, Languages, LogOut, Menu, Moon, Search, Settings as SettingsIcon, Sun, User, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { useCurrentUser } from '../lib/useCurrentUser'
import { ROLE_LABEL } from '../lib/permissions'

export default function TopBar({ onOpenNav }: { onOpenNav: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setTheme = useAppStore((s) => s.setTheme)
  const theme = useAppStore((s) => s.settings.theme)
  const signOut = useAppStore((s) => s.signOut)
  const { t, tb, language } = useTranslation()
  const { member: signedIn, role, canView } = useCurrentUser()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/applicants?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line bg-page/90 px-3 backdrop-blur sm:gap-4 sm:px-4">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label={t('nav_dashboard')}
        className="btn btn-ghost size-9 shrink-0 p-0 lg:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      <form className="flex min-w-0 max-w-md flex-1 items-center" onSubmit={handleSearch} role="search">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('action_search')}
            placeholder={language === 'ar' ? 'ابحث عن متقدم، صاحب عمل، طلب' : 'Search applicants, employers, requests'}
            className="field ps-8"
          />
        </div>
      </form>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          title={t('toggle_language')}
          aria-label={t('toggle_language')}
          className="btn btn-ghost px-2 sm:px-3"
        >
          <Languages className="size-3.5" />
          <span className="hidden sm:inline">{t('toggle_language')}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? t('toggle_theme_to_light') : t('toggle_theme_to_dark')}
          aria-label={theme === 'dark' ? t('toggle_theme_to_light') : t('toggle_theme_to_dark')}
          className="btn btn-ghost size-8 p-0"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label={`${t('nav_notifications')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          className="btn btn-ghost relative size-8 p-0"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="num absolute end-1 top-1 flex size-3.5 items-center justify-center rounded-pill bg-accent text-[9px] font-semibold text-accent-ink">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="relative ms-0.5 border-s border-line ps-1.5 sm:ms-1.5 sm:ps-2.5">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-control py-1 pe-1.5 hover:bg-raised"
          >
            <span className="flex size-7 items-center justify-center rounded-pill border border-line-strong bg-raised">
              <User className="size-3.5 text-ink-2" />
            </span>
            <span className="hidden text-start md:block">
              <span className="block text-[12px] font-semibold leading-tight text-ink">
                {signedIn ? tb(signedIn.name) : t('nav_staff')}
              </span>
              <span className="block text-[10px] leading-tight text-ink-3">{ROLE_LABEL[role][language]}</span>
            </span>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} role="presentation" />
              <div className="absolute end-0 top-11 z-20 w-44 overflow-hidden rounded-panel border border-line bg-surface py-1 shadow-pop">
                <p className="border-b border-line px-3 pb-2 pt-1.5">
                  <span className="block text-[10px] text-ink-3">{t('perm_signed_in_as')}</span>
                  <span className="block truncate text-[12px] font-semibold text-ink">
                    {signedIn ? tb(signedIn.name) : t('nav_staff')}
                  </span>
                  <span className="block text-[10.5px] text-accent-text">{ROLE_LABEL[role][language]}</span>
                </p>
                {canView('system') && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12px] text-ink-2 hover:bg-raised hover:text-ink"
                  >
                    <SettingsIcon className="size-3.5" /> {t('nav_settings')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/login')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12px] text-ink-2 hover:bg-raised hover:text-ink"
                >
                  <Users className="size-3.5" /> {t('perm_switch_user')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    if (window.confirm(language === 'ar' ? 'تسجيل الخروج من النظام؟' : 'Log out?')) {
                      signOut()
                      navigate('/login')
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12px] text-neg hover:bg-neg-soft"
                >
                  <LogOut className="size-3.5" /> {t('nav_logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
