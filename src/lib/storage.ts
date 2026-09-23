/*
  Where the files go.

  Two buckets for each kind of file, and the difference between them is the
  whole point. The private one holds every applicant's; publishing a worker
  copies hers into the public one, which anyone may read, and unpublishing
  takes it away again. So what a stranger can fetch is exactly what somebody
  chose to put on the website, not everything ever uploaded.

  The object keeps the same key in both, which is what lets the website build a
  URL from the one column the view exposes -- so the dashboard never has to
  hand out a public address itself.
*/

import { supabase, isSupabaseConfigured } from './supabase'

/** A private bucket, the public one beside it, and how to talk about them. */
interface Kind {
  private: string
  public: string
  fallbackType: string
  noun: string
}

const PHOTO: Kind = {
  private: 'worker-photos',
  public: 'published-photos',
  fallbackType: 'image/jpeg',
  noun: 'photograph',
}

const CV: Kind = {
  private: 'worker-documents',
  public: 'published-cvs',
  fallbackType: 'application/pdf',
  noun: 'CV',
}

export const storageAvailable = (): boolean => isSupabaseConfigured && supabase !== null

function extensionOf(file: File, fallback: string): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  return (fromName || file.type.split('/')[1] || fallback).toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function upload(kind: Kind, applicantId: string, file: File): Promise<string> {
  const client = supabase
  if (!client) throw new Error('No project is configured.')
  // A new name every time, so a replaced file is never served from a cache
  // that still holds the old one.
  const path = `${applicantId}/${crypto.randomUUID()}.${extensionOf(file, kind.fallbackType.split('/')[1])}`
  const { error } = await client.storage.from(kind.private).upload(path, file, {
    contentType: file.type || kind.fallbackType,
    upsert: false,
  })
  if (error) throw new Error(`The ${kind.noun} could not be saved: ${error.message}`)
  return path
}

async function remove(kind: Kind, path: string): Promise<void> {
  const client = supabase
  if (!client || !path) return
  await client.storage.from(kind.private).remove([path])
  await client.storage.from(kind.public).remove([path])
}

async function publish(kind: Kind, path: string): Promise<void> {
  const client = supabase
  if (!client || !path) return
  const { data, error } = await client.storage.from(kind.private).download(path)
  if (error || !data) {
    throw new Error(`The ${kind.noun} could not be published: ${error?.message ?? 'not found'}`)
  }
  const { error: upload } = await client.storage.from(kind.public).upload(path, data, {
    contentType: data.type || kind.fallbackType,
    upsert: true,
  })
  if (upload) throw new Error(`The ${kind.noun} could not be published: ${upload.message}`)
}

async function unpublish(kind: Kind, path: string): Promise<void> {
  const client = supabase
  if (!client || !path) return
  await client.storage.from(kind.public).remove([path])
}

// Signed links last an hour and cost a round trip, so each one is kept until
// it is close to expiring rather than asked for on every render.
const signed = new Map<string, { url: string; until: number }>()

async function signedUrl(kind: Kind, path: string): Promise<string | null> {
  const client = supabase
  if (!client || !path) return null

  const key = `${kind.private}/${path}`
  const held = signed.get(key)
  if (held && held.until > Date.now()) return held.url

  const { data, error } = await client.storage.from(kind.private).createSignedUrl(path, 3600)
  if (error || !data) return null
  signed.set(key, { url: data.signedUrl, until: Date.now() + 3_000_000 })
  return data.signedUrl
}

/* --------------------------------------------------------- photographs -- */

/** Puts a photograph in the private bucket and returns where it landed. */
export const uploadWorkerPhoto = (applicantId: string, file: File) => upload(PHOTO, applicantId, file)
export const removeWorkerPhoto = (path: string) => remove(PHOTO, path)
/** Copies a photograph into the bucket the website reads. */
export const publishPhoto = (path: string) => publish(PHOTO, path)
/** Takes it back out again. */
export const unpublishPhoto = (path: string) => unpublish(PHOTO, path)
/** A link to the private original, for the dashboard's own screens. */
export const signedPhotoUrl = (path: string) => signedUrl(PHOTO, path)

/* ------------------------------------------------------------- the CV -- */

export const uploadWorkerCv = (applicantId: string, file: File) => upload(CV, applicantId, file)
export const removeWorkerCv = (path: string) => remove(CV, path)
export const publishCv = (path: string) => publish(CV, path)
export const unpublishCv = (path: string) => unpublish(CV, path)
export const signedCvUrl = (path: string) => signedUrl(CV, path)
