import { Bell, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import PageHeader from '../components/PageHeader'
import { SecondaryButton } from '../components/form'

export default function Notifications() {
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const { t, language } = useTranslation()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_notifications')}
        subtitle={`${unreadCount} ${language === 'ar' ? 'غير مقروء' : 'unread'}`}
        actions={
          unreadCount > 0 ? (
            <SecondaryButton onClick={markAllNotificationsRead}>
              {language === 'ar' ? 'وضع علامة على الكل كمقروء' : 'Mark all as read'}
            </SecondaryButton>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${
              n.read ? 'border-[var(--edge-soft2)] bg-[var(--surface)]/60' : 'border-[var(--edge)] bg-[var(--surface)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-[var(--surface-hover)]' : 'bg-amber-500/20'}`}>
                <Bell className={`size-4 ${n.read ? 'text-[var(--text-muted)]' : 'text-amber-400'}`} />
              </span>
              <div>
                <p className={`text-sm ${n.read ? 'text-[var(--text-secondary)]' : 'font-medium text-[var(--text-primary)]'}`}>{n.title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{n.detail}</p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{n.date}</p>
              </div>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className="flex shrink-0 items-center gap-1 rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] hover:border-amber-500/40"
              >
                <Check className="size-3" /> {language === 'ar' ? 'وضع علامة كمقروء' : 'Mark read'}
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="py-8 text-center text-xs text-[var(--text-muted)]">{language === 'ar' ? 'لا توجد إشعارات.' : 'No notifications.'}</p>
        )}
      </div>
    </div>
  )
}
