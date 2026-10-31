/*
  The live peso rate.

  Read straight from a bank's published reference rate, with no key: a key
  shipped in a web page is a key anyone can read, and these services need
  none. The first is Frankfurter, which serves the European Central Bank's
  daily reference rates; if it cannot be reached, ExchangeRate-API's open
  endpoint is asked instead. Both answer a browser directly.

  The rate is fetched by each browser and kept for a few hours. The ECB
  publishes once each working day, around 16:00 Central European Time, so
  asking more often than that buys nothing. When neither service answers, the
  dashboard falls back to the rate saved in Settings.
*/

export interface LiveRate {
  /** Pesos to one dollar. */
  rate: number
  /** The day the rate is for, YYYY-MM-DD, as the source dates it. */
  date: string
  source: string
  /** When this browser fetched it, as an ISO instant. */
  fetchedAt: string
}

/** Fetched again once it is this old. */
const KEEP_FOR_MS = 6 * 60 * 60 * 1000

export function isStale(live: LiveRate | null, now = Date.now()): boolean {
  return !live || now - new Date(live.fetchedAt).getTime() > KEEP_FOR_MS
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    return (await response.json()) as Record<string, unknown>
  } finally {
    window.clearTimeout(timer)
  }
}

const usable = (rate: unknown): rate is number => typeof rate === 'number' && Number.isFinite(rate) && rate > 0

async function fromFrankfurter(): Promise<LiveRate> {
  const body = await getJson('https://api.frankfurter.app/latest?from=USD&to=PHP')
  const rate = (body.rates as Record<string, unknown> | undefined)?.PHP
  if (!usable(rate)) throw new Error('Frankfurter gave no peso rate.')
  return { rate, date: String(body.date ?? ''), source: 'European Central Bank', fetchedAt: new Date().toISOString() }
}

async function fromExchangeRateApi(): Promise<LiveRate> {
  const body = await getJson('https://open.er-api.com/v6/latest/USD')
  const rate = (body.rates as Record<string, unknown> | undefined)?.PHP
  if (body.result !== 'success' || !usable(rate)) throw new Error('ExchangeRate-API gave no peso rate.')
  const updated = body.time_last_update_utc ? new Date(String(body.time_last_update_utc)) : new Date()
  return {
    rate,
    date: Number.isNaN(updated.getTime()) ? '' : updated.toISOString().slice(0, 10),
    source: 'ExchangeRate-API',
    fetchedAt: new Date().toISOString(),
  }
}

/** The dollar's price in pesos today, from the first source that answers. */
export async function fetchLiveRate(): Promise<LiveRate> {
  try {
    return await fromFrankfurter()
  } catch (first) {
    try {
      return await fromExchangeRateApi()
    } catch (second) {
      const why = (e: unknown) => (e instanceof Error ? e.message : String(e))
      throw new Error(`The live peso rate could not be reached (${why(first)}; ${why(second)}).`)
    }
  }
}
