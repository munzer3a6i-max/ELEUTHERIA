import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

/**
 * Nothing behind the sign-in screen renders until an active account is signed
 * in. An account that was suspended while somebody was working in it stops
 * working at the next render, which is the point of suspending it.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const signedIn = useAppStore((s) => {
    const member = s.staff.find((m) => m.id === s.currentStaffId)
    return member?.status === 'Active'
  })

  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
