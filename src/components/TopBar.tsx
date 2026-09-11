import { Menu, Search, Bell, MessageSquare, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function TopBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/workers?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#152347] bg-[#091124] px-5">
      <form className="flex flex-1 items-center gap-3" onSubmit={handleSearch}>
        <button type="button" className="text-slate-400 hover:text-slate-200">
          <Menu className="size-5" />
        </button>
        <div className="relative max-w-96 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search worker, client, application..."
            className="w-full rounded border border-[#1b2b54] bg-[#0d1836] py-2 pl-3 pr-8 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <Search className="size-3.5" />
          </button>
        </div>
      </form>

      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-1 text-slate-300 hover:text-white"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-1 text-slate-300 hover:text-white"
        >
          <MessageSquare className="size-4" />
        </button>

        <div className="relative border-l border-[#1b2a52] pl-2.5">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2"
          >
            <div className="flex size-7 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
              <User className="size-4 text-slate-300" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-white">John Admin</p>
              <p className="text-[9px] text-slate-400">Administrator ▾</p>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-10 z-40 w-40 rounded border border-[#1b2b54] bg-[#0d1836] py-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/settings')
                }}
                className="block w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-[#101c3d]"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  if (window.confirm('Log out of Eleutheria?')) navigate('/login')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-400 hover:bg-[#101c3d]"
              >
                <LogOut className="size-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
