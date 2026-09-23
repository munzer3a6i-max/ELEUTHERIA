/*
  Where the files go.

  Two buckets for photographs, and the difference between them is the whole
  point. `worker-photos` is private and holds every applicant's; publishing a
  worker copies hers into `published-photos`, which anyone may read, and
  unpublishing takes it away again. So what a stranger can fetch is exactly
  what somebody chose to put on the website, not everything ever uploaded.

  The object keeps the same key in both, which is what lets the website build a
  URL from the one column the view exposes.
*/

import { supabase, isSupabaseConfigured } from './supabase'

const PRIVATE_PHOTOS = 'worker-photos'
const PUBLIC_PHOTOS = 'published-photos'

export const storageAvailable = (): boolean => isSupabaseConfigured && supabase !== null

function extensionOf(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  return (fromName || file.type.split('/')[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Puts a photograph in the private bucket and returns where it landed. */
export async function uploadWorkerPhoto(applicantId: string, file: File): Promise<string> {
  const client = supabase
  if (!client) throw new Error('No project is configured.')
  // A new name every time, so a replaced photograph is never served from a
  // cache that still holds the old one.
  const path = `${applicantId}/${crypto.randomUUID()}.${extensionOf(file)}`
  const { error } = await client.storage.from(PRIVATE_PHOTOS).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(`The photograph could not be saved: ${error.message}`)
  return path
}

export async function removeWorkerPhoto(path: string): Promise<void> {
  const client = supabase
  if (!client || !path) return
  await client.storage.from(PRIVATE_PHOTOS).remove([path])
  await client.storage.from(PUBLIC_PHOTOS).remove([path])
}

/** Copies a photograph into the bucket the website reads. */
export async function publishPhoto(path: string): Promise<void> {
  const client = supabase
  if (!client || !path) return
  const { data, error } = await client.storage.from(PRIVATE_PHOTOS).download(path)
  if (error || !data) throw new Error(`The photograph could not be published: ${error?.message ?? 'not found'}`)
  const { error: upload } = await client.storage.from(PUBLIC_PHOTOS).upload(path, data, {
    contentType: data.type || 'image/jpeg',
    upsert: true,
  })
  if (upload) throw new Error(`The photograph could not be published: ${upload.message}`)
}

/** Takes it back out again. */
export async function unpublishPhoto(path: string): Promise<void> {
  const client = supabase
  if (!client || !path) return
  await client.storage.from(PUBLIC_PHOTOS).remove([path])
}

/** The address the website uses. No key, no signing, no expiry. */
export function publicPhotoUrl(path: string): string | null {
  const client = supabase
  if (!client || !path) return null
  return client.storage.from(PUBLIC_PHOTOS).getPublicUrl(path).data.publicUrl
}

// Signed links last an hour and cost a round trip, so each one is kept until
// it is close to expiring rather than asked for on every render.
const signed = new Map<string, { url: string; until: number }>()

/** A link to the private original, for the dashboard's own screens. */
export async function signedPhotoUrl(path: string): Promise<string | null> {
  const client = supabase
  if (!client || !path) return null

  const held = signed.get(path)
  if (held && held.until > Date.now()) return held.url

  const { data, error } = await client.storage.from(PRIVATE_PHOTOS).createSignedUrl(path, 3600)
  if (error || !data) return null
  signed.set(path, { url: data.signedUrl, until: Date.now() + 3_000_000 })
  return data.signedUrl
}
