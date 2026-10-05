/*
  The other direction: a CV arrives, and the record is filled from it.

  Nothing is written without being shown first. Each field the reader
  recognised sits next to what the record already holds, ticked by default
  only where the record is empty, so an import can never quietly overwrite
  something somebody checked by hand. Whatever it could not find stays for the
  office to type, which is the arrangement that was asked for.
*/

import { useRef, useState } from 'react'
import { Check, FileUp, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { FIELD_LABELS, readCvFile, type ReadResult } from '../../../lib/cvImport'
import { setWorkerCv } from '../../../lib/cvs'
import { PrimaryButton, SecondaryButton } from '../../../components/form'
import type { Applicant, CvDetails } from '../../../types'

/** What the record holds for a field the reader can fill. */
function currentValue(applicant: Applicant, key: string): string {
  if (key.startsWith('cv.')) return String(applicant.cvDetails[key.slice(3) as keyof CvDetails] ?? '')
  const value = applicant[key as keyof Applicant]
  return value === null || value === undefined ? '' : String(value)
}

export default function CvImport({ applicant }: { applicant: Applicant }) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const { t, language } = useTranslation()
  const ar = language === 'ar'

  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ReadResult | null>(null)
  const [chosen, setChosen] = useState<Record<string, boolean>>({})
  const [keepFile, setKeepFile] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return

    setBusy(true)
    setNotice(null)
    setResult(null)
    try {
      const read = await readCvFile(picked)
      setFile(picked)
      setResult(read)
      setChosen(
        Object.fromEntries(
          Object.keys(read.found).map((key) => [key, currentValue(applicant, key).trim() === '']),
        ),
      )
    } catch (problem) {
      setNotice(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  async function apply() {
    if (!result || !file) return
    setBusy(true)
    setNotice(null)

    const patch: Partial<Applicant> = {}
    const details: Partial<CvDetails> = {}
    let count = 0

    for (const [key, value] of Object.entries(result.found)) {
      if (!chosen[key]) continue
      count += 1
      // Every field the reader fills is free text; `template` is the one
      // choice in CvDetails that is not, and nothing reads it off a CV.
      if (key.startsWith('cv.')) Object.assign(details, { [key.slice(3)]: value })
      else if (key === 'experienceYears') patch.experienceYears = Number(value) || 0
      else (patch as Record<string, unknown>)[key] = value
    }
    if (Object.keys(details).length > 0) patch.cvDetails = { ...applicant.cvDetails, ...details }
    if (Object.keys(patch).length > 0) updateApplicant(applicant.id, patch)

    try {
      if (keepFile) await setWorkerCv(applicant, file)
      setNotice(`${t('cv_import_applied')} ${count}`)
      setResult(null)
      setFile(null)
    } catch (problem) {
      setNotice(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  const rows = result ? Object.entries(result.found) : []

  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <h2 className="panel-title">{t('cv_import_title')}</h2>
      <p className="mt-0.5 text-[11px] text-ink-3">{t('cv_import_subtitle')}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={handleFile} />
        <SecondaryButton onClick={() => input.current?.click()} disabled={busy} className="flex items-center gap-1.5">
          <FileUp className="size-3.5" /> {busy && !result ? t('cv_import_reading') : t('cv_import_choose')}
        </SecondaryButton>
        {file && <span className="text-[11px] text-ink-2">{file.name}</span>}
      </div>

      {result?.imageOnly && (
        <p className="mt-3 flex items-start gap-1.5 rounded-control border border-line bg-sunken p-2.5 text-[11px] leading-relaxed text-ink-2">
          <TriangleAlert className="mt-px size-3.5 shrink-0 text-warn" />
          {t('cv_import_scanned')}
        </p>
      )}

      {result && !result.imageOnly && rows.length === 0 && (
        <p className="mt-3 text-[11px] text-ink-3">{t('cv_import_nothing')}</p>
      )}

      {rows.length > 0 && (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="py-2">{t('cv_import_use')}</th>
                  <th className="py-2">{t('label_name')}</th>
                  <th className="py-2">{t('cv_import_on_record')}</th>
                  <th className="py-2">{t('cv_import_in_file')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([key, value]) => {
                  const held = currentValue(applicant, key)
                  return (
                    <tr key={key} className="text-xs">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={chosen[key] ?? false}
                          onChange={(event) => setChosen((was) => ({ ...was, [key]: event.target.checked }))}
                          aria-label={FIELD_LABELS[key]?.[ar ? 'ar' : 'en'] ?? key}
                        />
                      </td>
                      <td className="py-2 text-ink">{FIELD_LABELS[key]?.[ar ? 'ar' : 'en'] ?? key}</td>
                      <td className="py-2 text-ink-3">{held || '—'}</td>
                      <td className="py-2 text-ink">{value}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <label className="mt-3 flex items-center gap-2 text-[11px] text-ink-2">
            <input type="checkbox" checked={keepFile} onChange={(event) => setKeepFile(event.target.checked)} />
            {t('cv_import_keep_file')}
          </label>

          <div className="mt-3 flex justify-end">
            <PrimaryButton onClick={apply} disabled={busy} className="flex items-center gap-1.5">
              <Check className="size-3.5" /> {t('cv_import_apply')}
            </PrimaryButton>
          </div>
        </>
      )}

      {notice && (
        <p className="mt-3 rounded-control border border-accent-line bg-accent-soft px-3 py-2 text-[11.5px] text-accent-text">
          {notice}
        </p>
      )}
    </div>
  )
}
