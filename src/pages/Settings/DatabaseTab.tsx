import { useEffect, useState } from 'react'
import { CheckCircle2, Database, Download, RefreshCw, TriangleAlert, XCircle } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { checkConnection, exportLocalData, type ConnectionState } from '../../lib/connection'
import Card from '../../components/Card'
import { SecondaryButton } from '../../components/form'

const TONE = {
  ok: { icon: CheckCircle2, className: 'text-pos' },
  warn: { icon: TriangleAlert, className: 'text-warn' },
  bad: { icon: XCircle, className: 'text-neg' },
} as const

/**
 * Where the data lives, and how to move it. Until a project is configured the
 * dashboard keeps everything in this browser, which is worth saying plainly on
 * the screen rather than leaving people to discover it.
 */
export default function DatabaseTab() {
  const [state, setState] = useState<ConnectionState>({ kind: 'checking' })
  const { t, language } = useTranslation()

  useEffect(() => {
    let current = true
    checkConnection().then((next) => {
      if (current) setState(next)
    })
    return () => {
      current = false
    }
  }, [])

  const report = {
    checking: { tone: 'warn', title: t('db_checking'), detail: '' },
    unconfigured: {
      tone: 'warn',
      title: t('db_unconfigured'),
      detail:
        language === 'ar'
          ? 'كل شيء محفوظ في هذا المتصفح فقط. اتبع docs/DATABASE.md لربط المشروع.'
          : 'Everything is kept in this browser alone. Follow docs/DATABASE.md to connect the project.',
    },
    ok: {
      tone: 'ok',
      title: t('db_connected'),
      detail:
        state.kind === 'ok'
          ? `${state.staff} ${language === 'ar' ? 'حساب' : 'accounts'} · ${state.signedIn ? t('db_session_open') : t('db_session_none')}`
          : '',
    },
    'schema-missing': {
      tone: 'bad',
      title: t('db_schema_missing'),
      detail:
        language === 'ar'
          ? 'شغّل الترحيلات ثم أضف ops إلى Exposed schemas في إعدادات المشروع.'
          : 'Run the migrations, then add `ops` under Project Settings, API, Exposed schemas.',
    },
    unreachable: {
      tone: 'bad',
      title: t('db_unreachable'),
      detail: state.kind === 'unreachable' ? state.detail : '',
    },
  }[state.kind]

  const Icon = TONE[report.tone as keyof typeof TONE].icon

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <Card icon={<Database className="size-3.5" />} title={t('db_title')} subtitle={t('db_subtitle')}>
          <div className="flex items-start gap-2.5">
            <Icon className={`mt-0.5 size-4 shrink-0 ${TONE[report.tone as keyof typeof TONE].className}`} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink">{report.title}</p>
              {report.detail && <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">{report.detail}</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SecondaryButton
              onClick={() => {
                setState({ kind: 'checking' })
                checkConnection().then(setState)
              }}
            >
              <RefreshCw className="size-3.5" /> {t('db_recheck')}
            </SecondaryButton>
            <SecondaryButton onClick={exportLocalData}>
              <Download className="size-3.5" /> {t('db_export')}
            </SecondaryButton>
          </div>

          <p className="mt-3 text-[10.5px] leading-relaxed text-ink-3">{t('db_export_hint')}</p>
        </Card>
      </div>

      <div className="lg:col-span-6">
        <Card title={t('db_steps_title')}>
          <ol className="flex list-decimal flex-col gap-2 ps-4 text-[12px] leading-relaxed text-ink-2 marker:text-ink-3">
            <li>{t('db_step_1')}</li>
            <li>{t('db_step_2')}</li>
            <li>{t('db_step_3')}</li>
            <li>{t('db_step_4')}</li>
            <li>{t('db_step_5')}</li>
          </ol>
          <p className="mt-3 rounded-control border border-line bg-sunken p-2.5 text-[10.5px] leading-relaxed text-ink-3">
            {t('db_docs_note')}
          </p>
        </Card>
      </div>
    </div>
  )
}
