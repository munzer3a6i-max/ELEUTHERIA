import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#060b18] font-sans text-slate-200">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#060b18]">{children}</main>
      </div>
    </div>
  )
}
