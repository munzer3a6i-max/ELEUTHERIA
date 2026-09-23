// The hook the page uses. Loads once, reloads when the filter changes, and
// cancels the old request so a slow reply cannot overwrite a newer one.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchWorkers, type Worker, type WorkerFilter } from './workers'

export interface WorkersState {
  workers: Worker[]
  loading: boolean
  /** A readable sentence when the load failed, null otherwise. */
  error: string | null
  reload: () => void
}

/** The last finished load: which request it answered, and what came back. */
interface Settled {
  key: string
  workers: Worker[]
  error: string | null
}

export function useWorkers(filter: WorkerFilter = {}): WorkersState {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)

  // The filter is usually written inline at the call site, so a new object
  // arrives on every render. Compare it by value, not by identity.
  const key = `${attempt}:${JSON.stringify(filter)}`
  const stable = useMemo(() => JSON.parse(key.slice(key.indexOf(':') + 1)) as WorkerFilter, [key])

  useEffect(() => {
    const controller = new AbortController()
    let live = true

    fetchWorkers(stable, controller.signal)
      .then((workers) => {
        if (live) setSettled({ key, workers, error: null })
      })
      .catch((problem: unknown) => {
        if (!live || controller.signal.aborted) return
        const said = problem instanceof Error ? problem.message : String(problem)
        setSettled({ key, workers: [], error: said })
      })

    return () => {
      live = false
      controller.abort()
    }
    // key and stable change together; key is what the result is stamped with.
  }, [key, stable])

  // Asking again is a new request, with a key of its own.
  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  // Loading is not state: it is simply that nothing has answered this request
  // yet. Derived here, it cannot fall out of step with the fetch.
  const answered = settled?.key === key

  return {
    workers: answered ? settled.workers : [],
    loading: !answered,
    error: answered ? settled.error : null,
    reload,
  }
}
