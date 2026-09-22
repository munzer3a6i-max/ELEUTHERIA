import {
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  Building,
  Building2,
  Calculator,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  Globe2,
  Handshake,
  Landmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Receipt,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
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
        `relative flex h-8 w-full items-center justify-between gap-2.5 rounded-control px-2.5 text-[12.5px] transition-colors ${
          isActive ? 'bg-accent-soft font-semibold text-accent-text' : 'text-ink-2 hover:bg-raised hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden="true" className="absolute inset-y-1 start-0 w-[2px] rounded-pill bg-accent" />}
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="num flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-[9px] font-semibold text-accent-ink">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavGroup({
  icon,
  label,
  active,
  children,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(active)
  const [wasActive, setWasActive] = useState(active)

  // Navigating into the group from elsewhere (a quick action, a link) opens it.
  if (active !== wasActive) {
    setWasActive(active)
    if (active) setOpen(true)
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex h-8 w-full items-center justify-between gap-2.5 rounded-control px-2.5 text-[12.5px] transition-colors ${
          active ? 'font-semibold text-accent-text' : 'text-ink-2 hover:bg-raised hover:text-ink'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className="shrink-0">{icon}</span>
          {label}
        </span>
        <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5 border-s border-line ps-2.5 ms-4">{children}</div>
      )}
    </div>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pb-1 pt-4 text-[10.5px] font-semibold text-ink-3 first:pt-1">{children}</p>
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const settings = useAppStore((s) => s.settings)
  const addonsActive = location.pathname.startsWith('/addons')
  const accountingActive = location.pathname.startsWith('/accounting')

  function handleLogout() {
    if (window.confirm(language === 'ar' ? 'تسجيل الخروج من النظام؟' : 'Log out?')) navigate('/login')
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col justify-between border-e border-line bg-sunken">
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-accent-line bg-accent-soft">
            <ShieldCheck className="size-5 text-accent-text" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold uppercase tracking-[0.08em] text-accent-text">
              {settings.companyName}
            </p>
            <p className="truncate text-[9.5px] text-ink-3">{settings.companyTagline}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
          <NavItem to="/" end icon={<LayoutDashboard className="size-4" />} label={t('nav_dashboard')} />

          <GroupLabel>{language === 'ar' ? 'العمليات' : 'Operations'}</GroupLabel>
          <NavItem to="/applicants" icon={<Users className="size-4" />} label={t('nav_applicants')} />
          <NavItem to="/employers" icon={<Building2 className="size-4" />} label={t('nav_employers')} />
          <NavItem to="/agencies" icon={<Handshake className="size-4" />} label={t('nav_agencies')} />
          <NavItem to="/recruitments" icon={<ClipboardList className="size-4" />} label={t('nav_recruitments')} />
          <NavItem to="/invoices" icon={<Receipt className="size-4" />} label={t('nav_invoices')} />

          <GroupLabel>{language === 'ar' ? 'المالية' : 'Finance'}</GroupLabel>
          <NavGroup icon={<Calculator className="size-4" />} label={t('nav_accounting')} active={accountingActive}>
            <NavItem to="/accounting" end icon={<Landmark className="size-3.5" />} label={t('fin_title')} />
            <NavItem to="/accounting/payroll" icon={<Banknote className="size-3.5" />} label={t('acc_payroll_title')} />
            <NavItem to="/accounting/agency-accounts" icon={<Building2 className="size-3.5" />} label={t('acc_agency_accounts_title')} />
            <NavItem to="/accounting/office-expenses" icon={<Building className="size-3.5" />} label={t('acc_office_expenses_title')} />
            <NavItem to="/accounting/reports" icon={<FileSpreadsheet className="size-3.5" />} label={t('acc_reports_title')} />
          </NavGroup>
          <NavItem to="/reports" icon={<BarChart3 className="size-4" />} label={t('nav_reports')} />

          <GroupLabel>{language === 'ar' ? 'النظام' : 'System'}</GroupLabel>
          <NavItem to="/staff" icon={<UserCog className="size-4" />} label={t('nav_staff')} />
          <NavGroup icon={<Wallet className="size-4" />} label={t('nav_addons')} active={addonsActive}>
            <NavItem to="/addons/countries" icon={<Globe2 className="size-3.5" />} label={language === 'ar' ? 'الدول' : 'Countries'} />
            <NavItem to="/addons/cities" icon={<MapPin className="size-3.5" />} label={language === 'ar' ? 'المدن' : 'Cities'} />
            <NavItem to="/addons/professions" icon={<Briefcase className="size-3.5" />} label={language === 'ar' ? 'المهن' : 'Professions'} />
            <NavItem to="/addons/payment-sources" icon={<Wallet className="size-3.5" />} label={language === 'ar' ? 'مصادر الدفع' : 'Payment Sources'} />
            <NavItem to="/addons/statuses" icon={<ListChecks className="size-3.5" />} label={language === 'ar' ? 'الحالات' : 'Statuses'} />
          </NavGroup>
          <NavItem to="/notifications" icon={<Bell className="size-4" />} label={t('nav_notifications')} badge={unreadCount} />
          <NavItem to="/settings" icon={<Settings className="size-4" />} label={t('nav_settings')} />
        </nav>
      </div>

      <div className="border-t border-line p-2.5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-8 w-full items-center gap-2.5 rounded-control px-2.5 text-start text-[12.5px] text-ink-2 hover:bg-raised hover:text-ink"
        >
          <LogOut className="size-4" /> {t('nav_logout')}
        </button>
        <p className="px-2.5 pt-2 text-[10px] leading-relaxed text-ink-3">
          {settings.licenseNumber}
          <br />
          {settings.address}
        </p>
      </div>
    </aside>
  )
}
