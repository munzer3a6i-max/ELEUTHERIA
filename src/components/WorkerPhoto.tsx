import { usePhotoUrl } from '../lib/photos'
import type { Applicant } from '../types'

/**
 * A worker's photograph wherever it is kept — in the record while the app runs
 * on its own, in Storage once there is a database — or whatever stands in for
 * one when there is none.
 */
export default function WorkerPhoto({
  applicant,
  fallback,
  alt = '',
}: {
  applicant: Pick<Applicant, 'photoDataUrl' | 'photoPath'>
  fallback: React.ReactNode
  alt?: string
}) {
  const url = usePhotoUrl(applicant)
  if (!url) return <>{fallback}</>
  return <img src={url} alt={alt} className="size-full object-cover" />
}
