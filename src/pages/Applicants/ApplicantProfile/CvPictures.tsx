/*
  The two pictures the bio data asks for beyond her headshot: the standing
  photograph beside her details, and the passport copy on its second page.

  Neither is ever published. They live in the private buckets and reach anybody
  outside the office only embedded in a CV somebody chose to send -- which is
  why they are uploaded here, next to the document that prints them, rather
  than with the photograph that goes on the website.
*/

import { useEffect, useRef, useState } from 'react'
import { ImageUp, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'
import { clearFullBodyPhoto, clearPassportCopy, setFullBodyPhoto, setPassportCopy } from '../../../lib/photos'
import { fullBodyAsDataUrl, passportCopyAsDataUrl } from '../../../lib/cvPhoto'
import type { Applicant } from '../../../types'

export default function CvPictures({ applicant }: { applicant: Applicant }) {
  const { t, language } = useTranslation()
  const ar = language === 'ar'

  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <h2 className="panel-title">{t('cv_pictures')}</h2>
      <p className="mt-0.5 text-[11px] text-ink-3">{t('cv_pictures_hint')}</p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slot
          applicant={applicant}
          label={ar ? 'صورة كاملة' : 'Full body photograph'}
          read={fullBodyAsDataUrl}
          onPick={setFullBodyPhoto}
          onClear={clearFullBodyPhoto}
          has={Boolean(applicant.fullBodyPath || applicant.fullBodyDataUrl)}
          accept="image/*"
        />
        <Slot
          applicant={applicant}
          label={ar ? 'صورة جواز السفر' : 'Passport copy'}
          read={passportCopyAsDataUrl}
          onPick={setPassportCopy}
          onClear={clearPassportCopy}
          has={Boolean(applicant.passportCopyPath || applicant.passportCopyDataUrl)}
          accept="image/*"
          note={applicant.passportCopyFileName ?? undefined}
        />
      </div>
    </div>
  )
}

function Slot({
  applicant,
  label,
  read,
  onPick,
  onClear,
  has,
  accept,
  note,
}: {
  applicant: Applicant
  label: string
  read: (applicant: Applicant) => Promise<string | null>
  onPick: (applicant: Applicant, file: File) => Promise<void>
  onClear: (applicant: Applicant) => Promise<void>
  has: boolean
  accept: string
  note?: string
}) {
  const { t, language } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void read(applicant).then((data) => {
      if (live) setPreview(data)
    })
    return () => {
      live = false
    }
  }, [applicant, read])

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProblem(null)
    onPick(applicant, file).catch((trouble: Error) => setProblem(trouble.message))
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-ink-2">{label}</p>
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-control border border-line bg-sunken">
        {has && preview ? (
          <img src={preview} alt={label} className="size-full object-contain" />
        ) : (
          <span className="text-[10.5px] text-ink-3">{t('attach_none')}</span>
        )}
      </div>
      {note && <p className="truncate text-[10.5px] text-ink-3">{note}</p>}
      <div className="flex items-center gap-2">
        <input ref={input} type="file" accept={accept} className="hidden" onChange={choose} />
        <button type="button" onClick={() => input.current?.click()} className="btn btn-secondary h-7 text-[11px]">
          <ImageUp className="size-3.5" /> {has ? t('action_edit') : t('attach_upload')}
        </button>
        {has && (
          <button
            type="button"
            onClick={() => {
              setPreview(null)
              onClear(applicant).catch((trouble: Error) => setProblem(trouble.message))
            }}
            className="text-ink-3 hover:text-neg"
            title={language === 'ar' ? 'حذف' : 'Remove'}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      {problem && <p className="text-[10.5px] font-medium text-neg">{problem}</p>}
    </div>
  )
}
