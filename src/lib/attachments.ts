/*
  Receipts live with the records they explain.

  Everything in this app is kept in the browser's localStorage, which is small
  and shared by the whole store, so a bill is accepted only if it is small
  enough to keep and there is room to keep it. The alternative — a filename
  with no file — is what lets a number go unchallenged, which is the thing
  these attachments exist to prevent.
*/

import type { Attachment } from '../types'

/** Per file. Photographs of a receipt sit far below this; scans rarely do not. */
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024

/** Everything the browser will keep for us, minus room to keep working. */
const STORE_BUDGET_BYTES = 4 * 1024 * 1024

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** How much of the browser's allowance the saved data is already using. */
export function storeBytes(key = 'mustaqdem-store'): number {
  try {
    return localStorage.getItem(key)?.length ?? 0
  } catch {
    return 0
  }
}

export class AttachmentError extends Error {}

/**
 * Reads a chosen file into an Attachment, refusing anything too large to keep
 * or anything that would not fit beside what is already saved. Base64 costs
 * about a third more than the file itself, which the room check allows for.
 */
export async function readAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentError(
      `${file.name} is ${formatBytes(file.size)}. The limit for one file is ${formatBytes(MAX_ATTACHMENT_BYTES)}.`,
    )
  }
  if (storeBytes() + file.size * 1.37 > STORE_BUDGET_BYTES) {
    throw new AttachmentError(
      'There is no room left in this browser for another file. Remove an older attachment first.',
    )
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new AttachmentError(`${file.name} could not be read.`))
    reader.readAsDataURL(file)
  })

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl,
    uploadedOn: new Date().toISOString().slice(0, 10),
  }
}

/** Turns the stored data URL back into bytes the browser can open directly. */
function toBlob(attachment: Attachment): Blob | null {
  const comma = attachment.dataUrl.indexOf(',')
  if (comma === -1) return null
  try {
    const binary = atob(attachment.dataUrl.slice(comma + 1))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: attachment.type || 'application/octet-stream' })
  } catch {
    return null
  }
}

/**
 * Opens an attachment in its own tab. Returns false when the record carries
 * only a filename, which is the case for anything logged before files were
 * kept.
 */
export function openAttachment(attachment: Attachment): boolean {
  const blob = toBlob(attachment)
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  // The tab holds its own reference; this only releases ours.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}
