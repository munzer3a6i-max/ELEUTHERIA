/*
  The answer to "why will this photograph not upload".

  Storage reports a missing bucket, a bucket whose rules refuse the account and
  a bucket that refuses the file all as "400 Bad Request", so the console
  cannot tell them apart and neither can anybody reading it. This tries each
  bucket in turn, from the signed-in browser, and says which of the three it
  is -- and what to do about it.
*/

import { useState } from 'react'
import { CheckCircle2, HardDrive, Loader2, ShieldAlert, TriangleAlert, XCircle } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { checkStorage, type StorageReport, type Verdict } from '../../lib/storageCheck'
import Card from '../../components/Card'
import { SecondaryButton } from '../../components/form'

const MARK: Record<Verdict, { icon: typeof CheckCircle2; className: string }> = {
  ok: { icon: CheckCircle2, className: 'text-pos' },
  missing: { icon: XCircle, className: 'text-neg' },
  refused: { icon: ShieldAlert, className: 'text-neg' },
  restricted: { icon: TriangleAlert, className: 'text-warn' },
  unknown: { icon: TriangleAlert, className: 'text-warn' },
}

export default function StorageCheck() {
  const { t } = useTranslation()
  const [report, setReport] = useState<StorageReport | null>(null)
  const [busy, setBusy] = useState(false)

  function run() {
    setBusy(true)
    checkStorage()
      .then(setReport)
      .finally(() => setBusy(false))
  }

  const settled = report?.buckets ?? []
  const everything = settled.length > 0 && settled.every((bucket) => bucket.verdict === 'ok')

  return (
    <Card icon={<HardDrive className="size-3.5" />} title={t('storage_title')} subtitle={t('storage_subtitle')}>
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton onClick={run} disabled={busy}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <HardDrive className="size-3.5" />}
          {busy ? t('storage_checking') : t('storage_check')}
        </SecondaryButton>
      </div>

      {report && (
        <div className="mt-3 flex flex-col gap-2">
          {report.staffDetail && (
            <p
              className={`rounded-control border border-line bg-sunken p-2.5 text-[11px] leading-relaxed ${
                report.staff === 'yes' ? 'text-ink-2' : 'text-neg'
              }`}
            >
              {report.staffDetail}
            </p>
          )}

          {everything && <p className="text-[11.5px] font-medium text-pos">{t('storage_all_ok')}</p>}

          {settled.map((bucket) => {
            const Icon = MARK[bucket.verdict].icon
            return (
              <div key={bucket.bucket} className="flex items-start gap-2.5">
                <Icon className={`mt-0.5 size-4 shrink-0 ${MARK[bucket.verdict].className}`} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink">
                    <code className="font-mono text-[11.5px]">{bucket.bucket}</code>
                    <span className="ms-1.5 font-normal text-ink-3">· {bucket.holds}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-2">{bucket.detail}</p>
                  {bucket.raw && (
                    <p className="mt-0.5 select-all break-words font-mono text-[10px] leading-relaxed text-ink-3">
                      {bucket.raw}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-3 text-[10.5px] leading-relaxed text-ink-3">{t('storage_hint')}</p>
    </Card>
  )
}
