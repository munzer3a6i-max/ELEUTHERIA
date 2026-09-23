import { TriangleAlert } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'
import Modal from './Modal'
import { PrimaryButton, SecondaryButton } from './form'

/**
 * A question with two answers, asked in the application's own voice.
 *
 * The browser's own confirm() says the page's address before it says anything
 * else, cannot be read in Arabic, and cannot show what is about to happen. This
 * can: `detail` is the thing itself -- the person being removed, the account
 * about to be made -- so nobody agrees to a sentence and means a different row.
 */
export default function Confirm({
  title,
  message,
  detail,
  confirmLabel,
  tone = 'normal',
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  detail?: string
  confirmLabel: string
  tone?: 'normal' | 'danger'
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex items-start gap-3">
        {tone === 'danger' && <TriangleAlert className="mt-0.5 size-4 shrink-0 text-neg" />}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-relaxed text-ink-2">{message}</p>
          {detail && (
            <p className="rounded-control border border-line bg-sunken px-2.5 py-2 text-[11.5px] text-ink">
              {detail}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
        <PrimaryButton
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={tone === 'danger' ? 'bg-neg text-white hover:bg-neg' : undefined}
        >
          {confirmLabel}
        </PrimaryButton>
      </div>
    </Modal>
  )
}
