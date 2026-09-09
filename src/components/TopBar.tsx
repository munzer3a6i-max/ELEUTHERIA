import { Menu, Search, Printer, FileDown, Send, ChevronDown, Bell, MessageSquare, User } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#152347] bg-[#091124] px-5">
      <div className="flex flex-1 items-center gap-3">
        <button type="button" className="text-slate-400 hover:text-slate-200">
          <Menu className="size-5" />
        </button>
        <div className="relative max-w-96 flex-1">
          <input
            type="text"
            placeholder="Search worker, client, application..."
            className="w-full rounded border border-[#1b2b54] bg-[#0d1836] py-2 pl-3 pr-8 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <Search className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-2 pr-2">
          <button type="button" className="flex items-center gap-1.5 rounded border border-[#1f3366] bg-[#101c3d] px-3.5 py-1.5 text-[11px] text-slate-300 hover:border-[#2c4685]">
            <Printer className="size-3.5" /> Print
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded border border-[#1f3366] bg-[#101c3d] px-3.5 py-1.5 text-[11px] text-slate-300 hover:border-[#2c4685]">
            <FileDown className="size-3.5" /> PDF
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded border border-[#1f3366] bg-[#101c3d] px-3.5 py-1.5 text-[11px] text-slate-300 hover:border-[#2c4685]">
            <Send className="size-3.5" /> Send to Client
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-slate-950 shadow-sm hover:bg-amber-500">
            Actions <ChevronDown className="size-3" />
          </button>
        </div>

        <button type="button" className="relative p-1 text-slate-300 hover:text-white">
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
            8
          </span>
        </button>
        <button type="button" className="relative p-1 text-slate-300 hover:text-white">
          <MessageSquare className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
            15
          </span>
        </button>

        <div className="flex items-center gap-2 border-l border-[#1b2a52] pl-2.5">
          <div className="flex size-7 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
            <User className="size-4 text-slate-300" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white">John Admin</p>
            <p className="text-[9px] text-slate-400">Administrator ▾</p>
          </div>
        </div>
      </div>
    </header>
  )
}
