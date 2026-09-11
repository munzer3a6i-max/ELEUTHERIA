import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  ClipboardList,
  Receipt,
  UserCog,
  ChevronDown,
  Globe2,
  MapPin,
  Briefcase,
  Wallet,
  ListChecks,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  badge?: number
  end?: boolean
}

function NavItem({ to, icon, label, badge, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-xs transition-colors ${
          isActive
            ? 'bg-[var(--active)] text-amber-500 shadow-sm'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
        }`
      }
    >
      <span className="flex items-center gap-3">
        <span className="size-4 shrink-0">{icon}</span>
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-950">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const [addonsOpen, setAddonsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const settings = useAppStore((s) => s.settings)
  const addonsActive = location.pathname.startsWith('/addons')

  function handleLogout() {
    if (window.confirm(language === 'ar' ? 'تسجيل الخروج من النظام؟' : 'Log out of Mustaqdem?')) {
      navigate('/login')
    }
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-e border-[var(--edge)] bg-[var(--sidebar)]">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--edge-soft)] px-4 pb-[17px] pt-4">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
            <ShieldCheck className="size-6 text-amber-500" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-serif text-[13px] font-bold uppercase tracking-[1.3px] text-amber-500">
              {settings.companyName}
            </p>
            <p className="text-[8px] uppercase tracking-[0.4px] text-[var(--text-muted)]">
              {settings.companyTagline}
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          <NavItem to="/" end icon={<LayoutDashboard className="size-4" />} label={t('nav_dashboard')} />
          <NavItem to="/applicants" icon={<Users className="size-4" />} label={t('nav_applicants')} />
          <NavItem to="/employers" icon={<Building2 className="size-4" />} label={t('nav_employers')} />
          <NavItem to="/agencies" icon={<Handshake className="size-4" />} label={t('nav_agencies')} />
          <NavItem to="/recruitments" icon={<ClipboardList className="size-4" />} label={t('nav_recruitments')} />
          <NavItem to="/invoices" icon={<Receipt className="size-4" />} label={t('nav_invoices')} />
          <NavItem to="/staff" icon={<UserCog className="size-4" />} label={t('nav_staff')} />

          <div className="w-full">
            <button
              type="button"
              onClick={() => setAddonsOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs ${
                addonsActive ? 'text-amber-500' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Wallet className="size-4" />
                {t('nav_addons')}
              </span>
              <ChevronDown className={`size-3.5 transition-transform ${addonsOpen ? 'rotate-180' : ''}`} />
            </button>
            {addonsOpen && (
              <div className="flex flex-col gap-1 py-1 ps-8 pe-2">
                <NavItem to="/addons/countries" icon={<Globe2 className="size-3.5" />} label={language === 'ar' ? 'الدول' : 'Countries'} />
                <NavItem to="/addons/cities" icon={<MapPin className="size-3.5" />} label={language === 'ar' ? 'المدن' : 'Cities'} />
                <NavItem to="/addons/professions" icon={<Briefcase className="size-3.5" />} label={language === 'ar' ? 'المهن' : 'Professions'} />
                <NavItem to="/addons/payment-sources" icon={<Wallet className="size-3.5" />} label={language === 'ar' ? 'مصادر الدفع' : 'Payment Sources'} />
                <NavItem to="/addons/statuses" icon={<ListChecks className="size-3.5" />} label={language === 'ar' ? 'الحالات' : 'Statuses'} />
              </div>
            )}
          </div>

          <NavItem to="/reports" icon={<BarChart3 className="size-4" />} label={t('nav_reports')} />
          <NavItem to="/notifications" icon={<Bell className="size-4" />} label={t('nav_notifications')} badge={unreadCount} />
          <NavItem to="/settings" icon={<Settings className="size-4" />} label={t('nav_settings')} />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="size-4" /> {t('nav_logout')}
          </button>
        </nav>
      </div>

      <div className="p-3">
        <div className="flex w-full flex-col gap-4 overflow-hidden rounded-lg border border-[#1e305e] bg-gradient-to-b from-[#0e1b3d] to-[#0a132b] p-[13px] shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-amber-400">
              {language === 'ar' ? 'شريكك في' : 'Your Partner in'}
            </p>
            <p className="text-xs font-bold text-white">
              {language === 'ar' ? 'بناء مستقبل أفضل' : 'Building Better Futures'}
            </p>
          </div>
          <div className="h-16 w-full opacity-40">
            <svg viewBox="0 0 220 64" className="h-full w-full" preserveAspectRatio="none">
              {[18, 40, 26, 54, 32, 46, 20, 60, 28, 44, 36, 50].map((h, i) => (
                <rect key={i} x={i * 19} y={64 - h} width={14} height={h} fill="#f59e0b" />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </aside>
  )
}
