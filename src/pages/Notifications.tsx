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
            className={`flex items-start justify-between gap-3 rounded-panel border p-4 ${
              n.read ? 'border-line bg-surface/60' : 'border-line bg-surface'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-pill ${n.read ? 'bg-raised' : 'bg-accent/20'}`}>
                <Bell className={`size-4 ${n.read ? 'text-ink-3' : 'text-accent-text'}`} />
              </span>
              <div>
                <p className={`text-sm ${n.read ? 'text-ink-2' : 'font-medium text-ink'}`}>{n.title}</p>
                <p className="mt-0.5 text-xs text-ink-3">{n.detail}</p>
                <p className="mt-1 text-[10px] text-ink-3">{n.date}</p>
              </div>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className="flex shrink-0 items-center gap-1 rounded-control border border-line-strong bg-raised px-2.5 py-1 text-[10px] text-ink-2 hover:border-accent-line"
              >
                <Check className="size-3" /> {language === 'ar' ? 'وضع علامة كمقروء' : 'Mark read'}
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-3">{language === 'ar' ? 'لا توجد إشعارات.' : 'No notifications.'}</p>
        )}
      </div>
    </div>
  )
}
