import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ListChecks,
  Wallet,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FolderOpen,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface NavLinkItemProps {
  to: string
  icon: React.ReactNode
  label: string
  badge?: number
  end?: boolean
}

function NavItem({ to, icon, label, badge, end }: NavLinkItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-xs transition-colors ${
          isActive
            ? 'bg-[#192b59] text-[#fbbf24] shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
            : 'text-[#94a3b8] hover:bg-[#101c3d] hover:text-[#cbd5e1]'
        }`
      }
    >
      <span className="flex items-center gap-3">
        <span className="size-4 shrink-0">{icon}</span>
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-[#f59e0b] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#020617]">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const [accountingOpen, setAccountingOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const accountingActive = location.pathname.startsWith('/accounting')

  function handleLogout() {
    if (window.confirm('Log out of Eleutheria?')) {
      navigate('/login')
    }
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-r border-[#152347] bg-[#091124]">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-[#142246] px-4 pb-[17px] pt-4">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
            <ShieldCheck className="size-6 text-amber-500" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-serif text-[13px] font-bold uppercase tracking-[1.3px] text-amber-500">
              Eleutheria
            </p>
            <p className="text-[8px] uppercase tracking-[0.4px] text-slate-400">
              International Placement
              <br />
              Services Inc.
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          <NavItem to="/" end icon={<LayoutDashboard className="size-4" />} label="Dashboard" />
          <NavItem to="/workers" icon={<Users className="size-4" />} label="Workers" />
          <NavItem to="/clients" icon={<Building2 className="size-4" />} label="Clients" />
          <NavItem to="/applications" icon={<FileText className="size-4" />} label="Applications" />
          <NavItem to="/recruitment-stages" icon={<ListChecks className="size-4" />} label="Recruitment Stages" />

          <div className="w-full">
            <button
              type="button"
              onClick={() => setAccountingOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs ${
                accountingActive ? 'text-[#fbbf24]' : 'text-[#94a3b8] hover:bg-[#101c3d] hover:text-[#cbd5e1]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Wallet className="size-4" />
                Accounting
              </span>
              <ChevronDown
                className={`size-3.5 transition-transform ${accountingOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {accountingOpen && (
              <div className="flex flex-col gap-1 py-1 pl-8 pr-2">
                <NavItem to="/accounting/income" icon={<TrendingUp className="size-3.5" />} label="Income" />
                <NavItem to="/accounting/expenses" icon={<TrendingDown className="size-3.5" />} label="Expenses" />
                <NavItem to="/accounting/payments" icon={<CreditCard className="size-3.5" />} label="Payments" />
                <NavItem to="/accounting/documents" icon={<FolderOpen className="size-3.5" />} label="Documents" />
              </div>
            )}
          </div>

          <NavItem to="/reports" icon={<BarChart3 className="size-4" />} label="Reports" />
          <NavItem to="/staff" icon={<UserCog className="size-4" />} label="Staff" />
          <NavItem to="/notifications" icon={<Bell className="size-4" />} label="Notifications" badge={unreadCount} />
          <NavItem to="/settings" icon={<Settings className="size-4" />} label="Settings" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs text-[#94a3b8] hover:bg-[#101c3d] hover:text-[#cbd5e1]"
          >
            <LogOut className="size-4" /> Log Out
          </button>
        </nav>
      </div>

      <div className="p-3">
        <div className="flex w-full flex-col gap-4 overflow-hidden rounded-lg border border-[#1e305e] bg-gradient-to-b from-[#0e1b3d] to-[#0a132b] p-[13px] shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-amber-400">Your Partner in</p>
            <p className="text-xs font-bold text-white">Building Better</p>
            <p className="text-xs font-bold text-white">Futures</p>
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
