/*
  A worker's CV, and whether the public may read it.

  It mirrors her photograph: a file in a private bucket with its path on the
  record, copied into a public bucket while she is on the website. Before a
  database exists there is nowhere to put a document, so the office's chosen
  file is remembered by name and uploaded the first time it is replaced after
  connecting. A photograph survives that gap as a data URL; a CV cannot, since
  a PDF would fill the browser's own storage on its own.
*/

import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import {
  publishCv,
  removeWorkerCv,
  signedCvUrl,
  storageAvailable,
  uploadWorkerCv,
} from './storage'
import type { Applicant } from '../types'

/** A link the office can open, or null while there is nothing to open. */
export function useCvUrl(applicant: Pick<Applicant, 'cvPath'>): string | null {
  // The signed link is remembered with the path it was signed for, so a record
  // whose CV has just changed never opens the one it replaced.
  const [signed, setSigned] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    const path = applicant.cvPath
    if (!path) return
    let current = true
    void signedCvUrl(path).then((url) => {
      if (current) setSigned({ path, url })
    })
    return () => {
      current = false
    }
  }, [applicant.cvPath])

  if (!applicant.cvPath) return null
  return signed?.path === applicant.cvPath ? signed.url : null
}

/**
 * Takes a chosen file and puts it where CVs go. A worker already on the
 * website gets her new CV published straight away, and the one it replaced is
 * deleted rather than left behind.
 */
export async function setWorkerCv(applicant: Applicant, file: File): Promise<void> {
  const update = useAppStore.getState().updateApplicant

  if (!storageAvailable()) {
    update(applicant.id, { cvFileName: file.name, cvPath: null })
    return
  }

  const previous = applicant.cvPath
  const path = await uploadWorkerCv(applicant.id, file)
  update(applicant.id, { cvPath: path, cvFileName: file.name })
  if (applicant.cvLinkedToWebsite) await publishCv(path)
  if (previous && previous !== path) await removeWorkerCv(previous)
}

/** Takes the CV away entirely, from the website and from the office alike. */
export async function clearWorkerCv(applicant: Applicant): Promise<void> {
  useAppStore.getState().updateApplicant(applicant.id, { cvFileName: null, cvPath: null })
  if (applicant.cvPath) await removeWorkerCv(applicant.cvPath)
}
