/*
  Her photograph, as something a single file can carry.

  The CV is one HTML document that has to work when it is downloaded, emailed
  or opened from the website, so the photograph travels inside it as a data URL
  rather than as a link to a bucket that may want a signature by then.
*/

import { signedFullBodyUrl, signedPassportCopyUrl, signedPhotoUrl } from './storage'
import type { Applicant } from '../types'

/** Whatever is held for one picture, as something a single file can carry. */
async function asDataUrl(
  held: string | null,
  path: string | null,
  sign: (path: string) => Promise<string | null>,
): Promise<string | null> {
  if (held) return held
  if (!path) return null

  const url = await sign(path)
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

export const photoAsDataUrl = (applicant: Applicant) =>
  asDataUrl(applicant.photoDataUrl, applicant.photoPath, signedPhotoUrl)

export const fullBodyAsDataUrl = (applicant: Applicant) =>
  asDataUrl(applicant.fullBodyDataUrl, applicant.fullBodyPath, signedFullBodyUrl)

export const passportCopyAsDataUrl = (applicant: Applicant) =>
  asDataUrl(applicant.passportCopyDataUrl, applicant.passportCopyPath, signedPassportCopyUrl)
