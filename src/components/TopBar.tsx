import { Menu, Search, Bell, User, LogOut, Languages, Moon, Sun } from 'lucide-react'
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
  const { t, language } = useTranslation()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/applicants?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--edge)] bg-[var(--sidebar)] px-5">
      <form className="flex flex-1 items-center gap-3" onSubmit={handleSearch}>
        <button type="button" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <Menu className="size-5" />
        </button>
        <div className="relative max-w-96 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن متقدم، صاحب عمل، طلب...' : 'Search applicant, employer, request...'}
            className="w-full rounded border border-[var(--edge)] bg-[var(--input)] py-2 ps-3 pe-8 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <button type="submit" className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <Search className="size-3.5" />
          </button>
        </div>
      </form>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          title={t('toggle_language')}
          className="flex items-center gap-1.5 rounded border border-[var(--edge)] bg-[var(--input)] px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Languages className="size-3.5" /> {t('toggle_language')}
        </button>

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? t('toggle_theme_to_light') : t('toggle_theme_to_dark')}
          className="flex items-center justify-center rounded border border-[var(--edge)] bg-[var(--input)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="relative border-s border-[var(--edge)] ps-2.5">
          <button type="button" onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full border border-[var(--edge-strong)] bg-[var(--surface-hover)]">
              <User className="size-4 text-[var(--text-secondary)]" />
            </div>
            <div className="text-start">
              <p className="text-[11px] font-bold text-[var(--text-primary)]">Kylie</p>
              <p className="text-[9px] text-[var(--text-muted)]">Admin ▾</p>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute end-0 top-10 z-40 w-40 rounded border border-[var(--edge)] bg-[var(--surface)] py-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/settings')
                }}
                className="block w-full px-3 py-2 text-start text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              >
                {t('nav_settings')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  if (window.confirm(language === 'ar' ? 'تسجيل الخروج من النظام؟' : 'Log out of Mustaqdem?'))
                    navigate('/login')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs text-rose-400 hover:bg-[var(--surface-hover)]"
              >
                <LogOut className="size-3.5" /> {t('nav_logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
