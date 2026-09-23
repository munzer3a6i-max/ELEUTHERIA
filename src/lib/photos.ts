/*
  A worker's photograph, and whether the public may see it.

  In the browser alone a photograph is a data URL on the record. Connected, it
  is a file in a private bucket and the record holds its path; publishing the
  worker copies that file into the bucket the website reads, and unpublishing
  removes it. So the screens ask for "her photograph" and get the right thing
  either way.
*/

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import {
  publishPhoto,
  removeWorkerPhoto,
  signedPhotoUrl,
  storageAvailable,
  uploadWorkerPhoto,
} from './storage'
import type { Applicant } from '../types'

type Photographed = Pick<Applicant, 'photoDataUrl' | 'photoPath'>

/** Her photograph, wherever it happens to live. Null when there is not one. */
export function usePhotoUrl(applicant: Photographed): string | null {
  // The signed link is remembered with the path it was signed for, so a record
  // whose photograph has just changed never shows the one it replaced.
  const [signed, setSigned] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    const path = applicant.photoPath
    if (!path || applicant.photoDataUrl) return
    let current = true
    void signedPhotoUrl(path).then((url) => {
      if (current) setSigned({ path, url })
    })
    return () => {
      current = false
    }
  }, [applicant.photoDataUrl, applicant.photoPath])

  if (applicant.photoDataUrl) return applicant.photoDataUrl
  if (!applicant.photoPath) return null
  return signed?.path === applicant.photoPath ? signed.url : null
}

/**
 * Takes a chosen file and puts it wherever photographs go. A worker already on
 * the website gets her new photograph published straight away, and the one it
 * replaced is deleted rather than left behind.
 */
export async function setWorkerPhoto(applicant: Applicant, file: File): Promise<void> {
  const update = useAppStore.getState().updateApplicant

  if (!storageAvailable()) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('That file could not be read.'))
      reader.readAsDataURL(file)
    })
    update(applicant.id, { photoDataUrl: dataUrl, photoPath: null })
    return
  }

  const previous = applicant.photoPath
  const path = await uploadWorkerPhoto(applicant.id, file)
  update(applicant.id, { photoPath: path, photoDataUrl: null })
  if (applicant.cvLinkedToWebsite) await publishPhoto(path)
  if (previous && previous !== path) await removeWorkerPhoto(previous)
}
