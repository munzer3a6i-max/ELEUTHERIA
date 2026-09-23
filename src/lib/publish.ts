/*
  Putting a worker on the website, and taking her off it.

  One column decides whether her row is in the view the site reads. Her
  photograph and her CV are files, and they have to follow that column into the
  public buckets, or she appears on the site with no face and nothing to read.
  Unpublishing has to take them back out, which is the half that matters: it is
  what makes "not on the website" mean the files are gone rather than merely
  unlinked.
*/

import { useAppStore } from '../store/useAppStore'
import { publishCv, publishPhoto, storageAvailable, unpublishCv, unpublishPhoto } from './storage'
import type { Applicant } from '../types'

export async function setPublished(applicant: Applicant, published: boolean): Promise<void> {
  useAppStore.getState().updateApplicant(applicant.id, { cvLinkedToWebsite: published })
  if (!storageAvailable()) return

  if (published) {
    if (applicant.photoPath) await publishPhoto(applicant.photoPath)
    if (applicant.cvPath) await publishCv(applicant.cvPath)
    return
  }

  if (applicant.photoPath) await unpublishPhoto(applicant.photoPath)
  if (applicant.cvPath) await unpublishCv(applicant.cvPath)
}
