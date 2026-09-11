import { Bell, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import PageHeader from '../components/PageHeader'
import { SecondaryButton } from '../components/form'

export default function Notifications() {
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          unreadCount > 0 ? (
            <SecondaryButton onClick={markAllNotificationsRead}>Mark all as read</SecondaryButton>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${
              n.read ? 'border-[#122046] bg-[#0a142f]/60' : 'border-[#162650] bg-[#0a142f]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-slate-800' : 'bg-amber-500/20'}`}>
                <Bell className={`size-4 ${n.read ? 'text-slate-500' : 'text-amber-400'}`} />
              </span>
              <div>
                <p className={`text-sm ${n.read ? 'text-slate-400' : 'font-medium text-slate-100'}`}>{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{n.detail}</p>
                <p className="mt-1 text-[10px] text-slate-600">{n.date}</p>
              </div>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className="flex shrink-0 items-center gap-1 rounded border border-[#23386d] bg-[#101c3d] px-2.5 py-1 text-[10px] text-slate-300 hover:border-amber-500/40"
              >
                <Check className="size-3" /> Mark read
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No notifications.</p>}
      </div>
    </div>
  )
}
