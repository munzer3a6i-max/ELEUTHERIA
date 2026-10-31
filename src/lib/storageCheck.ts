/*
  Why a file will not upload.

  Supabase Storage answers four quite different refusals with the same "400
  Bad Request": the bucket does not exist, the rules on it forbid this
  account, the bucket only accepts certain types, or the key is malformed. The
  browser console shows the status and nothing else, so the only honest way to
  tell them apart is to try -- from the signed-in browser, which is the only
  place that has the session the real upload would use.

  So this puts a one-pixel picture into each bucket and deletes it again,
  reporting in words what came back. It is the same request an upload makes,
  with nothing of anybody's in it.
*/

import { supabase, isSupabaseConfigured } from './supabase'

/** The buckets the dashboard needs, and what creates each one. */
const BUCKETS: { id: string; madeBy: string; holds: string }[] = [
  { id: 'worker-photos', madeBy: '0003_storage.sql', holds: 'photographs' },
  { id: 'worker-documents', madeBy: '0003_storage.sql', holds: 'CVs and passport copies' },
  { id: 'bills', madeBy: '0003_storage.sql', holds: 'receipts' },
  { id: 'published-photos', madeBy: '0005_published_photos.sql', holds: "the website's photographs" },
  { id: 'published-cvs', madeBy: '0006_published_cvs.sql', holds: "the website's CVs" },
]

export type Verdict = 'ok' | 'missing' | 'refused' | 'restricted' | 'unknown'

export interface BucketReport {
  bucket: string
  holds: string
  verdict: Verdict
  /** What to do about it, in a sentence. */
  detail: string
  /** Exactly what Storage said, for when the sentence is not enough. */
  raw: string
}

export interface StorageReport {
  signedIn: boolean
  /** What the database answers when asked whether this account is staff. */
  staff: 'yes' | 'no' | 'unknown'
  staffDetail: string
  buckets: BucketReport[]
}

/** A one-pixel PNG. Small enough that no size limit can refuse it. */
const PIXEL =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='

function pixel(): Blob {
  const binary = atob(PIXEL)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: 'image/png' })
}

/** Storage puts the HTTP status on the error; the message is its body. */
function statusOf(error: unknown): number | null {
  const status = (error as { status?: unknown })?.status
  return typeof status === 'number' ? status : null
}

function read(message: string, status: number | null): BucketReport['verdict'] {
  if (/bucket not found|not found/i.test(message)) return 'missing'
  if (/mime type|content type|too large|maximum allowed size|payload/i.test(message)) return 'restricted'
  if (/row-level security|policy|unauthorized|permission denied|new row violates/i.test(message)) return 'refused'
  if (status === 403) return 'refused'
  return 'unknown'
}

function advise(bucket: { id: string; madeBy: string }, verdict: Verdict): string {
  switch (verdict) {
    case 'ok':
      return 'Uploads work.'
    case 'missing':
      return `No such bucket in this project. Run db/${bucket.madeBy} (or add the bucket under Storage, named exactly ${bucket.id}, not public).`
    case 'refused':
      return `The bucket is there, but its rules refuse this account. Run db/fix-storage.sql, which rewrites the rules for all five buckets.`
    case 'restricted':
      return `The bucket refuses the file itself -- something set a type or size limit on it. Open Storage, ${bucket.id}, and clear "Allowed MIME types" and the file size limit, or run db/fix-storage.sql.`
    default:
      return 'Storage refused it for a reason the dashboard does not recognise. The exact words are below.'
  }
}

async function probe(bucket: { id: string; madeBy: string; holds: string }): Promise<BucketReport> {
  const client = supabase
  const path = `diagnostic/${crypto.randomUUID()}.png`
  const base = { bucket: bucket.id, holds: bucket.holds }

  if (!client) return { ...base, verdict: 'unknown', detail: 'No project is configured.', raw: '' }

  const { error } = await client.storage.from(bucket.id).upload(path, pixel(), {
    contentType: 'image/png',
    upsert: true,
  })

  if (!error) {
    // Tidy up. A failure here is not worth reporting: the upload, which is
    // what was being tested, worked.
    await client.storage.from(bucket.id).remove([path])
    return { ...base, verdict: 'ok', detail: advise(bucket, 'ok'), raw: '' }
  }

  const status = statusOf(error)
  const verdict = read(error.message, status)
  return {
    ...base,
    verdict,
    detail: advise(bucket, verdict),
    raw: status ? `${status} — ${error.message}` : error.message,
  }
}

/** Tries every bucket and says, for each, what is wrong with it. */
export async function checkStorage(): Promise<StorageReport> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      signedIn: false,
      staff: 'unknown',
      staffDetail: 'No project is configured, so files stay in this browser and nothing is uploaded.',
      buckets: [],
    }
  }

  const client = supabase
  const { data: session } = await client.auth.getSession()

  // The storage rules ask ops.is_staff(); asking it directly separates "the
  // rules are missing" from "the rules are there and say no".
  let staff: StorageReport['staff'] = 'unknown'
  let staffDetail = ''
  const answer = await client.rpc('is_staff')
  if (answer.error) {
    staffDetail = `The database could not be asked whether this account is staff: ${answer.error.message}`
  } else if (answer.data === true) {
    staff = 'yes'
    staffDetail = 'The database recognises this account as active staff.'
  } else {
    staff = 'no'
    staffDetail =
      'The database does not recognise this account as active staff, so every upload is refused. Settings, Users, Link sign-in accounts.'
  }

  const buckets = await Promise.all(BUCKETS.map(probe))
  return { signedIn: Boolean(session.session), staff, staffDetail, buckets }
}
