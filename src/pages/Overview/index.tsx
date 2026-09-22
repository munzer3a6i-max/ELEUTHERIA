import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookUser,
  CalendarClock,
  ClipboardList,
  FileWarning,
  HandCoins,
  Landmark,
  PlaneLanding,
  Plus,
  Receipt,
  Users,
} from 'lucide-react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import StatStrip from '../../components/StatStrip'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'
import { useOverview } from './useOverview'
import brandLogo from '../../assets/eleutheria-logo.png'
import type { AlertKind } from './useOverview'

const ALERT_ICON: Record<AlertKind, typeof AlertTriangle> = {
  stalled: CalendarClock,
  passport: BookUser,
  invoice: FileWarning,
  payroll: Banknote,
  commission: HandCoins,
  charge: Receipt,
  backout: PlaneLanding,
}

const ALERT_TONE: Record<AlertKind, string> = {
  stalled: 'text-warn',
  passport: 'text-neg',
  invoice: 'text-warn',
  payroll: 'text-info',
  commission: 'text-warn',
  charge: 'text-warn',
  backout: 'text-neg',
}

export default function Overview() {
  const settings = useAppStore((s) => s.settings)
  const currency = settings.currency
  const { t, language } = useTranslation()
  const { stages, alerts, activity, agencyLoad, counts } = useOverview()

  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const peakStage = Math.max(1, ...stages.map((stage) => stage.count))
  const maxAgencyLoad = Math.max(1, ...agencyLoad.map((row) => row.workers))

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="panel flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <img
          src={brandLogo}
          alt={`${settings.companyName} ${settings.companyTagline}`}
          width={672}
          height={180}
          className="h-14 w-auto"
        />
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <dt className="text-ink-3">{t('fin_licence')}</dt>
            <dd className="num text-ink-2">{settings.licenseNumber}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-ink-3">{language === 'ar' ? 'المكتب' : 'Office'}</dt>
            <dd className="text-ink-2">{settings.address}</dd>
          </div>
        </dl>
      </div>

      <PageHeader
        title={t('nav_dashboard')}
        subtitle={today}
        actions={
          <>
            <Link to="/applicants" className="btn btn-secondary">
              <Plus className="size-3.5" />
              {t('fin_add_worker')}
            </Link>
            <Link to="/recruitments" className="btn btn-secondary">
              <ClipboardList className="size-3.5" />
              {language === 'ar' ? 'طلب استقدام' : 'New request'}
            </Link>
            <Link to="/accounting" className="btn btn-primary">
              <Landmark className="size-3.5" />
              {t('fin_title')}
            </Link>
          </>
        }
      />

      <StatStrip
        stats={[
          {
            label: t('nav_applicants'),
            value: String(counts.workers),
            note: `${counts.available} ${language === 'ar' ? 'متاح للتوظيف' : 'available to place'}`,
            icon: <Users className="size-4" />,
          },
          {
            label: language === 'ar' ? 'استقدام جارٍ' : 'Placements in progress',
            value: String(counts.activePlacements),
            note: `${counts.deployed} ${language === 'ar' ? 'تم وصولهم' : 'deployed to date'}`,
            lead: true,
            icon: <ClipboardList className="size-4" />,
          },
          {
            label: language === 'ar' ? 'بحاجة إلى متابعة' : 'Needs attention',
            value: String(alerts.length),
            note: language === 'ar' ? 'عناصر متأخرة أو قريبة الانتهاء' : 'overdue or expiring items',
            tone: alerts.length > 0 ? 'warn' : undefined,
            icon: <AlertTriangle className="size-4" />,
          },
          {
            label: t('acc_outstanding'),
            value: formatMoney(counts.receivables, currency, 0),
            note: `${counts.openInvoices} ${language === 'ar' ? 'فاتورة مفتوحة' : 'open invoices'}`,
            tone: counts.receivables > 0 ? 'warn' : undefined,
            icon: <Receipt className="size-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="grid content-start gap-4 lg:col-span-7">
          <Card
            title={language === 'ar' ? 'أين تقف الحالات' : 'Where the caseload sits'}
            subtitle={
              language === 'ar'
                ? 'الطلبات النشطة حسب المرحلة الحالية'
                : 'Active requests by the stage they are on now'
            }
          >
            {stages.length === 0 ? (
              <p className="py-10 text-center text-[12px] text-ink-3">
                {language === 'ar' ? 'لا توجد طلبات نشطة.' : 'Nothing in the pipeline right now.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {stages.map((stage) => (
                  <li key={stage.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3">
                    <span className="truncate text-[12px] text-ink-2">{stage.label}</span>
                    <span className="h-2 overflow-hidden rounded-pill bg-sunken">
                      <span
                        className="block h-full rounded-pill bg-info"
                        style={{ width: `${(stage.count / peakStage) * 100}%` }}
                      />
                    </span>
                    <span className="num text-end text-[12px] font-medium text-ink">{stage.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={language === 'ar' ? 'بحاجة إلى متابعة' : 'Needs attention'}
            subtitle={
              language === 'ar'
                ? 'الأكثر إلحاحًا أولًا'
                : 'Sorted by how long it has been waiting'
            }
            bodyClassName="p-0"
          >
            {alerts.length === 0 ? (
              <p className="px-4 py-12 text-center text-[12px] text-ink-3">
                {language === 'ar'
                  ? 'لا شيء متأخر. كل الملفات تسير في موعدها.'
                  : 'Nothing overdue. Every file is moving on time.'}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {alerts.slice(0, 6).map((alert) => {
                  const Icon = ALERT_ICON[alert.kind]
                  return (
                    <li key={alert.id}>
                      <Link to={alert.to} className="flex items-center gap-3 px-4 py-2.5 hover:bg-raised">
                        <Icon className={`size-4 shrink-0 ${ALERT_TONE[alert.kind]}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-ink">{alert.title}</span>
                          <span className="block truncate text-[11px] text-ink-3">{alert.detail}</span>
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-ink-3 rtl:rotate-180" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-4 lg:col-span-5">
          <Card
            title={language === 'ar' ? 'آخر التحديثات' : 'Latest stage updates'}
            action={
              <Link to="/recruitments" className="text-[11px] text-accent-text hover:text-accent">
                {t('fin_view_all')}
              </Link>
            }
            bodyClassName="p-0"
          >
            {activity.length === 0 ? (
              <p className="px-4 py-12 text-center text-[12px] text-ink-3">{t('acc_no_rows')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link to={item.to} className="flex items-center gap-3 px-4 py-2.5 hover:bg-raised">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink">{item.worker}</span>
                        <span className="num block text-[11px] text-ink-3">
                          {item.date}
                          {item.by ? ` · ${item.by}` : ''}
                        </span>
                      </span>
                      <StatusBadge status={item.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={language === 'ar' ? 'العمالة حسب المكتب' : 'Workers by partner office'}
            action={
              <Link to="/accounting/agency-accounts" className="text-[11px] text-accent-text hover:text-accent">
                {t('fin_view_details')}
              </Link>
            }
          >
            <ul className="flex flex-col gap-3">
              {agencyLoad.map((row) => (
                <li key={row.id} className="text-[12px]">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="truncate text-ink">{row.name}</span>
                    <span className="num shrink-0 text-ink-3">
                      {row.deployed}/{row.workers} {language === 'ar' ? 'تم وصولهم' : 'deployed'}
                    </span>
                  </div>
                  <span className="relative block h-2 w-full overflow-hidden rounded-pill bg-sunken">
                    <span
                      className="absolute inset-y-0 start-0 rounded-pill bg-info-soft"
                      style={{ width: `${(row.workers / maxAgencyLoad) * 100}%` }}
                    />
                    <span
                      className="absolute inset-y-0 start-0 rounded-pill bg-pos"
                      style={{ width: `${(row.deployed / maxAgencyLoad) * 100}%` }}
                    />
                  </span>
                </li>
              ))}
              {agencyLoad.length === 0 && (
                <li className="py-8 text-center text-[12px] text-ink-3">{t('acc_no_rows')}</li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
