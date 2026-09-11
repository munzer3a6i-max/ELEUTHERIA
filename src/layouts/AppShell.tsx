import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-[var(--page)] font-sans text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[var(--page)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
