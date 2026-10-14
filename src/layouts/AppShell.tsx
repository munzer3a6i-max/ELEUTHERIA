import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { DESKTOP_QUERY, useMediaQuery } from '../lib/useMediaQuery'
import { useAppStore } from '../store/useAppStore'

export default function AppShell() {
  const showPeso = useAppStore((s) => s.settings.showPeso)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  // Navigating closes the drawer, and widening the window hands the sidebar back.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    if (navOpen) setNavOpen(false)
  }
  const [wasDesktop, setWasDesktop] = useState(isDesktop)
  if (isDesktop !== wasDesktop) {
    setWasDesktop(isDesktop)
    if (isDesktop && navOpen) setNavOpen(false)
  }

  // The page behind the drawer should not scroll under it.
  useEffect(() => {
    if (!navOpen || isDesktop) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [navOpen, isDesktop])

  return (
    <div className="flex min-h-[100dvh] bg-page text-ink">
      <Sidebar open={navOpen} isDesktop={isDesktop} onClose={() => setNavOpen(false)} />
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <TopBar onOpenNav={() => setNavOpen(true)} />
        <main className="min-w-0 flex-1">
          {/* Amounts are formatted by a plain function, not a hook, so the page
              is remounted when the peso switch flips: cheaper than teaching
              every table to subscribe to it, and the switch is a deliberate act. */}
          <div key={showPeso ? 'peso' : 'usd'} className="mx-auto w-full max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
