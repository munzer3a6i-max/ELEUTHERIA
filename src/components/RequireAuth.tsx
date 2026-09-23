import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useSync } from '../data/sync'
import { useTranslation } from '../i18n/useTranslation'

/**
 * Nothing behind the sign-in screen renders until an active account is signed
 * in. An account that was suspended while somebody was working in it stops
 * working at the next render, which is the point of suspending it.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const connecting = useSync((s) => s.state.kind === 'loading')
  const { t } = useTranslation()
  const signedIn = useAppStore((s) => {
    const member = s.staff.find((m) => m.id === s.currentStaffId)
    return member?.status === 'Active'
  })

  // Reading the database takes a moment; bouncing to the sign-in screen and
  // back again in that moment would be worse than waiting.
  if (connecting && !signedIn) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-page text-ink-3">
        <Loader2 className="size-5 animate-spin" />
        <p className="text-[12.5px]">{t('sync_connecting')}</p>
      </div>
    )
  }

  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
