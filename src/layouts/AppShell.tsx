import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-[#060b18] font-sans text-slate-200">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#060b18]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
