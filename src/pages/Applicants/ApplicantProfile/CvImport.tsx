/*
  The other direction: a CV arrives, and the record is filled from it.

  Nothing is written without being shown first. Each field the reader
  recognised sits next to what the record already holds, ticked by default
  only where the record is empty, so an import can never quietly overwrite
  something somebody checked by hand. Every value it offers can be corrected
  in place before it is applied -- a reader gets a digit wrong now and then,
  and retyping the whole field somewhere else is the wrong price for that.
  Whatever it could not find stays for the office to type on the Applicant
  Information tab, where every field is editable.

  Given a file, it reads it the moment it mounts: that is how Upload CV on the
  information tab hands over the file it just stored, so uploading a CV and
  reading it are one act rather than two.
*/

import { useEffect, useRef, useState } from 'react'
import { Check, FileUp, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { FIELD_LABELS, readCvFile, type ReadResult } from '../../../lib/cvImport'
import { setWorkerCv } from '../../../lib/cvs'
import { spanYears } from '../../../lib/experience'
import { PrimaryButton, SecondaryButton } from '../../../components/form'
import type { Applicant, CvDetails } from '../../../types'

/** What the record holds for a field the reader can fill. */
function currentValue(applicant: Applicant, key: string): string {
  if (key.startsWith('cv.')) return String(applicant.cvDetails[key.slice(3) as keyof CvDetails] ?? '')
  const value = applicant[key as keyof Applicant]
  return value === null || value === undefined ? '' : String(value)
}

export default function CvImport({
  applicant,
  file: given = null,
  fileKept = false,
  onDone,
}: {
  applicant: Applicant
  /** A file already chosen elsewhere, read as soon as this mounts. */
  file?: File | null
  /** True when that file is already stored as her CV, so there is nothing to keep. */
  fileKept?: boolean
  onDone?: () => void
}) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const addExperience = useAppStore((s) => s.addExperience)
  const { t, language } = useTranslation()
  const ar = language === 'ar'

  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ReadResult | null>(null)
  const [chosen, setChosen] = useState<Record<string, boolean>>({})
  /** The values as the office has corrected them, keyed like `found`. */
  const [values, setValues] = useState<Record<string, string>>({})
  const [jobs, setJobs] = useState<boolean[]>([])
  const [keepFile, setKeepFile] = useState(!fileKept)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function read(picked: File) {
    setBusy(true)
    setNotice(null)
    setResult(null)
    try {
      const got = await readCvFile(picked)
      setFile(picked)
      setResult(got)
      setValues({ ...got.found })
      setChosen(
        Object.fromEntries(
          Object.keys(got.found).map((key) => [key, currentValue(applicant, key).trim() === '']),
        ),
      )
      // A job already on her record is not offered twice.
      setJobs(
        got.experience.map(
          (job) =>
            !applicant.experience.some(
              (held) => held.fromYear === job.fromYear && held.toYear === job.toYear && held.title === job.title,
            ),
        ),
      )
    } catch (problem) {
      setNotice(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (given) void read(given)
    // The applicant is read at the moment the file is handed over; a later
    // edit to her record does not re-read the file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [given])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (picked) await read(picked)
  }

  async function apply() {
    if (!result || !file) return
    setBusy(true)
    setNotice(null)

    const patch: Partial<Applicant> = {}
    const details: Partial<CvDetails> = {}
    let count = 0

    for (const key of Object.keys(result.found)) {
      if (!chosen[key]) continue
      const value = (values[key] ?? '').trim()
      if (!value) continue
      count += 1
      // Every field the reader fills is free text; `template` is the one
      // choice in CvDetails that is not, and nothing reads it off a CV.
      if (key.startsWith('cv.')) Object.assign(details, { [key.slice(3)]: value })
      else if (key === 'experienceYears') patch.experienceYears = Number(value) || 0
      else if (key === 'gender') patch.gender = value === 'Male' ? 'Male' : 'Female'
      else (patch as Record<string, unknown>)[key] = value
    }
    if (Object.keys(details).length > 0) patch.cvDetails = { ...applicant.cvDetails, ...details }
    if (Object.keys(patch).length > 0) updateApplicant(applicant.id, patch)

    result.experience.forEach((job, index) => {
      if (!jobs[index]) return
      count += 1
      addExperience(applicant.id, {
        title: job.title,
        employer: job.employer,
        fromYear: job.fromYear,
        toYear: job.toYear,
        years: spanYears(job.fromYear, job.toYear),
        duties: '',
        country: '',
      })
    })

    try {
      if (keepFile && !fileKept) await setWorkerCv(applicant, file)
      setNotice(`${t('cv_import_applied')} ${count}`)
      setResult(null)
      setFile(null)
      onDone?.()
    } catch (problem) {
      setNotice(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  const rows = result ? Object.keys(result.found) : []
  const foundJobs = result?.experience ?? []

  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <h2 className="panel-title">{t('cv_import_title')}</h2>
      <p className="mt-0.5 text-[11px] text-ink-3">{t('cv_import_subtitle')}</p>

      {!given && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={handleFile} />
          <SecondaryButton onClick={() => input.current?.click()} disabled={busy} className="flex items-center gap-1.5">
            <FileUp className="size-3.5" /> {busy && !result ? t('cv_import_reading') : t('cv_import_choose')}
          </SecondaryButton>
          {file && <span className="text-[11px] text-ink-2">{file.name}</span>}
        </div>
      )}
      {given && busy && !result && <p className="mt-3 text-[11px] text-ink-3">{t('cv_import_reading')}</p>}

      {result?.imageOnly && (
        <p className="mt-3 flex items-start gap-1.5 rounded-control border border-line bg-sunken p-2.5 text-[11px] leading-relaxed text-ink-2">
          <TriangleAlert className="mt-px size-3.5 shrink-0 text-warn" />
          {t('cv_import_scanned')}
        </p>
      )}

      {result && !result.imageOnly && rows.length === 0 && foundJobs.length === 0 && (
        <p className="mt-3 text-[11px] text-ink-3">{t('cv_import_nothing')}</p>
      )}

      {(rows.length > 0 || foundJobs.length > 0) && (
        <>
          {rows.length > 0 && (
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
                  {rows.map((key) => {
                    const held = currentValue(applicant, key)
                    const label = FIELD_LABELS[key]?.[ar ? 'ar' : 'en'] ?? key
                    return (
                      <tr key={key} className="text-xs">
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={chosen[key] ?? false}
                            onChange={(event) => setChosen((was) => ({ ...was, [key]: event.target.checked }))}
                            aria-label={label}
                          />
                        </td>
                        <td className="py-2 text-ink">{label}</td>
                        <td className="py-2 text-ink-3">{held || '—'}</td>
                        <td className="py-2">
                          <input
                            value={values[key] ?? ''}
                            onChange={(event) => {
                              const next = event.target.value
                              setValues((was) => ({ ...was, [key]: next }))
                              // Correcting a value is choosing it.
                              setChosen((was) => ({ ...was, [key]: true }))
                            }}
                            aria-label={`${label} — ${t('cv_import_in_file')}`}
                            className="w-full min-w-40 rounded-control border border-line bg-sunken px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-focus"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {foundJobs.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold text-ink-2">{t('cv_import_jobs')}</p>
              <ul className="divide-y divide-line rounded-control border border-line">
                {foundJobs.map((job, index) => (
                  <li key={`${job.fromYear}-${job.toYear}-${index}`} className="flex items-center gap-2 px-3 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={jobs[index] ?? false}
                      onChange={(event) => setJobs((was) => was.map((v, i) => (i === index ? event.target.checked : v)))}
                      aria-label={job.title}
                    />
                    <span className="text-ink">{job.title}</span>
                    {job.employer && <span className="text-ink-3">· {job.employer}</span>}
                    <span className="num ms-auto text-ink-3">
                      {job.fromYear} - {job.toYear}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-[10.5px] leading-relaxed text-ink-3">{t('cv_import_rest')}</p>

          {!fileKept && (
            <label className="mt-3 flex items-center gap-2 text-[11px] text-ink-2">
              <input type="checkbox" checked={keepFile} onChange={(event) => setKeepFile(event.target.checked)} />
              {t('cv_import_keep_file')}
            </label>
          )}

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
