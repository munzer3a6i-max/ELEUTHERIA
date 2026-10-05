/*
  Her photograph, as something a single file can carry.

  The CV is one HTML document that has to work when it is downloaded, emailed
  or opened from the website, so the photograph travels inside it as a data URL
  rather than as a link to a bucket that may want a signature by then.
*/

import { signedPhotoUrl } from './storage'
import type { Applicant } from '../types'

export async function photoAsDataUrl(applicant: Applicant): Promise<string | null> {
  if (applicant.photoDataUrl) return applicant.photoDataUrl
  if (!applicant.photoPath) return null

  const url = await signedPhotoUrl(applicant.photoPath)
  if (!url) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    // A CV without a photograph is still a CV.
    return null
  }
}
