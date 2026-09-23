// Reading the workers the office has published.
//
// The office marks a worker "On the website" in the dashboard. That, and only
// that, puts her row in public.published_workers, which this file reads. There
// is no build step and no webhook: publish her in the dashboard and she is on
// the site on the next page load.
//
// This talks to Supabase over plain fetch so the website needs no new
// dependency. If the site already uses @supabase/supabase-js, the same query is
// supabase.from('published_workers').select('*').

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

/** One row of public.published_workers. This is everything the site can see. */
export interface Worker {
  id: string
  english_name: string
  arabic_name: string
  gender: 'Male' | 'Female'
  /** Years, worked out from a date of birth the website never receives. */
  age: number | null
  country: string
  profession: string
  type: 'Domestic' | 'Profession'
  experience_years: number
  /** Key inside the published-photos bucket, or null when she has no photo. */
  photo_path: string | null
  updated_at: string
}

export interface WorkerFilter {
  country?: string
  profession?: string
  type?: Worker['type']
  gender?: Worker['gender']
  /** Matches either name, case insensitively. */
  search?: string
  limit?: number
}

/**
 * The address of a published photograph, or null when there is none.
 *
 * The bucket is public, so this is an ordinary image URL: put it straight in an
 * <img src>. Unpublishing a worker deletes the file, which is the point.
 */
export function photoUrl(worker: Pick<Worker, 'photo_path'>): string | null {
  if (!worker.photo_path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/published-photos/${worker.photo_path}`
}

function query(filter: WorkerFilter): string {
  const params = new URLSearchParams()
  params.set('select', '*')
  params.set('order', 'updated_at.desc')
  if (filter.country) params.set('country', `eq.${filter.country}`)
  if (filter.profession) params.set('profession', `eq.${filter.profession}`)
  if (filter.type) params.set('type', `eq.${filter.type}`)
  if (filter.gender) params.set('gender', `eq.${filter.gender}`)
  if (filter.search) {
    const term = `*${filter.search}*`
    params.set('or', `(english_name.ilike.${term},arabic_name.ilike.${term})`)
  }
  params.set('limit', String(filter.limit ?? 200))
  return params.toString()
}

/** Fetches the published workers. Throws with a readable message if it cannot. */
export async function fetchWorkers(
  filter: WorkerFilter = {},
  signal?: AbortSignal,
): Promise<Worker[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('paste-')) {
    throw new Error(
      'The Supabase address and anon key are not set. See website/eleutheria/config.ts.',
    )
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/published_workers?${query(filter)}`, {
    signal,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `The workers could not be loaded (${response.status}). ${body.slice(0, 300)}`.trim(),
    )
  }

  return (await response.json()) as Worker[]
}

/** The distinct values in a column, for building a dropdown. */
export function optionsFor(workers: Worker[], key: 'country' | 'profession'): string[] {
  const seen = new Set<string>()
  for (const worker of workers) if (worker[key]) seen.add(worker[key])
  return [...seen].sort((a, b) => a.localeCompare(b))
}
