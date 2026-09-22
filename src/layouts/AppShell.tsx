import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

export default function AppShell() {
  return (
    <div className="flex min-h-[100dvh] bg-page text-ink">
      <Sidebar />
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
