/*
  Keeping the browser and the database in step.

  Reading is simple: fetch every table once when somebody signs in, fold the
  rows into the shapes the app works in, and hand them to the store.

  Writing is where the care goes. Rather than teaching sixty actions to save
  themselves -- and forgetting the sixty-first -- the store is watched, each
  change is projected into rows, and whatever differs from the last projection
  is sent. An action nobody thought about saves correctly, because nothing
  depends on it having been thought about.

  Three tables are not the browser's to fill in. Commissions, agency charges
  and backouts are derived from the stage log by the database, so the client
  may settle one or annotate one, but never create or remove one. After a
  change that could move a milestone, they are read back instead.
*/

import { create } from 'zustand'
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase'
import { assemble, type Assembled, type Tables } from './assemble'
import { diff, project, TABLE_ORDER, type Change, type Projection, type TableName } from './project'
import { useAppStore } from '../store/useAppStore'
import { canEdit } from '../lib/permissions'
import { setServerOwnsBilling } from './ownership'
import type { StaffRole } from '../types'

/** Rows the database derives for itself. The client settles, never creates. */
const DERIVED: TableName[] = ['agent_commissions', 'agency_charges', 'backouts']

/** Changing any of these can move a milestone, and so move what is owed. */
const MOVES_MONEY: TableName[] = ['request_status_history', 'applicants', 'agents', 'agency_contracts']

/** Which area a table belongs to, so a role is not asked to write what it cannot. */
const AREA: Record<TableName, 'finance' | 'operations' | 'system'> = {
  countries: 'system',
  cities: 'system',
  professions: 'system',
  payment_sources: 'system',
  staff: 'system',
  agencies: 'operations',
  agents: 'operations',
  employers: 'operations',
  applicants: 'operations',
  applicant_experience: 'operations',
  applicant_education: 'operations',
  applicant_documents: 'operations',
  applicant_notes: 'operations',
  requests: 'operations',
  request_status_history: 'operations',
  invoices: 'finance',
  invoice_payments: 'finance',
  payroll_entries: 'finance',
  office_expenses: 'finance',
  agency_contracts: 'finance',
  agency_charges: 'finance',
  agent_commissions: 'finance',
  backouts: 'finance',
  backout_costs: 'finance',
  notifications: 'operations',
}

export type SyncState =
  | { kind: 'off' }
  | { kind: 'loading' }
  | { kind: 'ready'; savedAt: string | null }
  | { kind: 'saving'; pending: number }
  | { kind: 'error'; message: string; pending: number }

export const useSync = create<{ state: SyncState; set: (state: SyncState) => void }>((set) => ({
  state: { kind: isSupabaseConfigured ? 'ready' : 'off', savedAt: null } as SyncState,
  set: (state) => set({ state }),
}))

const status = (state: SyncState) => useSync.getState().set(state)

// ------------------------------------------------------------------ read --

/** Every table, as the signed-in role is allowed to see it. */
export async function loadEverything(): Promise<Assembled> {
  const client = requireSupabase()
  const tables: Tables = {}

  await Promise.all(
    TABLE_ORDER.map(async (table) => {
      const { data, error } = await client.from(table).select('*')
      // A role that may not read a table gets nothing back rather than an
      // error, which is the point of the rules; a real failure is thrown.
      if (error && error.code !== 'PGRST116') throw new Error(`${table}: ${error.message}`)
      tables[table] = data ?? []
    }),
  )

  return assemble(tables)
}

/** Just the tables the database maintains, after something moved a milestone. */
async function reloadDerived(): Promise<Partial<Assembled>> {
  const client = requireSupabase()
  const tables: Tables = {}
  await Promise.all(
    [...DERIVED, 'backout_costs'].map(async (table) => {
      const { data, error } = await client.from(table).select('*')
      if (error && error.code !== 'PGRST116') throw new Error(`${table}: ${error.message}`)
      tables[table] = data ?? []
    }),
  )
  const assembled = assemble(tables)
  return {
    agentCommissions: assembled.agentCommissions,
    agencyCharges: assembled.agencyCharges,
    backouts: assembled.backouts,
  }
}

// ----------------------------------------------------------------- write --

let watching: (() => void) | null = null
let lastSaved: Projection | null = null
let queue: Change[] = []
let flushing = false
/** Set while server data is being put into the store, so it is not sent back. */
let applying = false

function roleNow(): StaffRole {
  const state = useAppStore.getState()
  const member = state.staff.find((m) => m.id === state.currentStaffId)
  return member && member.status === 'Active' ? member.role : 'data_entry'
}

/** Folds the queue into one set of changes per table, newest value winning. */
function merge(changes: Change[]): Change[] {
  const byTable = new Map<TableName, { upserts: Map<string, Record<string, unknown>>; deletes: Set<string> }>()
  for (const change of changes) {
    const entry = byTable.get(change.table) ?? { upserts: new Map(), deletes: new Set() }
    for (const row of change.upserts) {
      entry.deletes.delete(String(row.id))
      entry.upserts.set(String(row.id), row)
    }
    for (const id of change.deletes) {
      entry.upserts.delete(id)
      entry.deletes.add(id)
    }
    byTable.set(change.table, entry)
  }
  return TABLE_ORDER.filter((table) => byTable.has(table)).map((table) => ({
    table,
    upserts: [...byTable.get(table)!.upserts.values()],
    deletes: [...byTable.get(table)!.deletes],
  }))
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return
  flushing = true
  const batch = merge(queue)
  queue = []
  status({ kind: 'saving', pending: batch.length })

  const client = requireSupabase()
  const role = roleNow()
  const known = new Set<string>()
  for (const table of DERIVED) {
    for (const id of lastSaved?.get(table)?.keys() ?? []) known.add(id)
  }

  try {
    let movedMoney = false

    for (const change of batch) {
      if (!canEdit(role, AREA[change.table])) continue
      if (MOVES_MONEY.includes(change.table)) movedMoney = true

      if (DERIVED.includes(change.table)) {
        // Settling a commission or annotating a backout, never creating one.
        for (const row of change.upserts) {
          if (!known.has(String(row.id))) continue
          const { id, ...fields } = row
          const { error } = await client.from(change.table).update(fields).eq('id', id as string)
          if (error) throw new Error(`${change.table}: ${error.message}`)
        }
        continue
      }

      if (change.upserts.length > 0) {
        const { error } = await client.from(change.table).upsert(change.upserts)
        if (error) throw new Error(`${change.table}: ${error.message}`)
      }
    }

    // Children go before their parents, which is this list backwards.
    for (const change of [...batch].reverse()) {
      if (change.deletes.length === 0) continue
      if (!canEdit(role, AREA[change.table]) || DERIVED.includes(change.table)) continue
      const { data, error } = await client.from(change.table).delete().in('id', change.deletes).select('id')
      if (error) throw new Error(`${change.table}: ${error.message}`)
      // A delete the rules forbid removes nothing and reports success, so the
      // count is the only way to know it was refused.
      if ((data?.length ?? 0) === 0) {
        throw new Error(`${change.table}: the database would not delete those rows`)
      }
    }

    if (movedMoney) {
      const derived = await reloadDerived()
      applying = true
      useAppStore.setState(derived)
      applying = false
      lastSaved = project(useAppStore.getState())
    }

    status({ kind: 'ready', savedAt: new Date().toISOString() })
  } catch (error) {
    // Put it back: an unsaved change is not a change to forget.
    queue = [...batch, ...queue]
    status({
      kind: 'error',
      message: error instanceof Error ? error.message : String(error),
      pending: queue.length,
    })
  } finally {
    flushing = false
    if (queue.length > 0 && useSync.getState().state.kind !== 'error') void flush()
  }
}

/** Exposed for scripts/test-sync.mjs, which checks the folding rules directly. */
export const __mergeForTests = merge

/** Sends whatever is queued again, after an error the person has dealt with. */
export function retrySaving(): void {
  void flush()
}

/**
 * Replaces the store with what the database holds, then watches for changes.
 * Nothing is sent until this has run, so the first load can never be mistaken
 * for a hundred edits.
 */
export async function connect(): Promise<void> {
  status({ kind: 'loading' })
  const loaded = await loadEverything()

  applying = true
  useAppStore.setState(loaded)
  applying = false

  lastSaved = project(useAppStore.getState())
  setServerOwnsBilling(true)
  status({ kind: 'ready', savedAt: null })

  watching?.()
  watching = useAppStore.subscribe((state) => {
    if (applying) {
      lastSaved = project(state)
      return
    }
    const next = project(state)
    const changes = diff(lastSaved ?? next, next)
    lastSaved = next
    if (changes.length === 0) return
    queue.push(...changes)
    void flush()
  })
}

export function disconnect(): void {
  watching?.()
  watching = null
  setServerOwnsBilling(false)
  lastSaved = null
  queue = []
  status({ kind: isSupabaseConfigured ? 'ready' : 'off', savedAt: null })
}

