import { Bell, Languages, LogOut, Moon, Search, Settings as SettingsIcon, Sun, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'

export default function TopBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setTheme = useAppStore((s) => s.setTheme)
  const theme = useAppStore((s) => s.settings.theme)
  const staff = useAppStore((s) => s.staff)
  const { t, tb, language } = useTranslation()

  const signedIn = staff[0]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/applicants?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-page/90 px-4 backdrop-blur">
      <form className="flex max-w-md flex-1 items-center" onSubmit={handleSearch} role="search">
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

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          title={t('toggle_language')}
          className="btn btn-ghost"
        >
          <Languages className="size-3.5" />
          {t('toggle_language')}
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

        <div className="relative ms-1.5 border-s border-line ps-2.5">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-control py-1 pe-1.5 hover:bg-raised"
          >
            <span className="flex size-7 items-center justify-center rounded-pill border border-line-strong bg-raised">
              <User className="size-3.5 text-ink-2" />
            </span>
            <span className="text-start">
              <span className="block text-[12px] font-semibold leading-tight text-ink">
                {signedIn ? tb(signedIn.name) : t('nav_staff')}
              </span>
              <span className="block text-[10px] leading-tight text-ink-3">
                {signedIn?.role === 'admin' ? (language === 'ar' ? 'مدير' : 'Administrator') : language === 'ar' ? 'موظف' : 'Staff'}
              </span>
            </span>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} role="presentation" />
              <div className="absolute end-0 top-11 z-20 w-44 overflow-hidden rounded-panel border border-line bg-surface py-1 shadow-pop">
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
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    if (window.confirm(language === 'ar' ? 'تسجيل الخروج من النظام؟' : 'Log out?')) navigate('/login')
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
