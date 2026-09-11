import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Trash2, User } from 'lucide-react'
import { useAppStore, computeWorkerTotals, formatCurrency } from '../../store/useAppStore'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { WorkerStatus } from '../../types'

const STATUS_FILTERS: (WorkerStatus | 'All')[] = ['All', 'In Process', 'Deployed', 'On Hold', 'Cancelled']

export default function WorkersList() {
  const workers = useAppStore((s) => s.workers)
  const clients = useAppStore((s) => s.clients)
  const addWorker = useAppStore((s) => s.addWorker)
  const deleteWorker = useAppStore((s) => s.deleteWorker)

  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [statusFilter, setStatusFilter] = useState<WorkerStatus | 'All'>('All')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchesQuery =
        !query ||
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.fileNo.toLowerCase().includes(query.toLowerCase()) ||
        w.client.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'All' || w.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [workers, query, statusFilter])

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      deleteWorker(id)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title="Workers"
        subtitle={`${workers.length} total worker${workers.length === 1 ? '' : 's'}`}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add Worker
          </PrimaryButton>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
            placeholder="Search by name, file no, or client..."
            className="w-full rounded border border-[#1b2b54] bg-[#0d1836] py-2 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded px-2.5 py-1.5 text-[11px] ${
                statusFilter === s
                  ? 'bg-[#192b59] text-amber-400'
                  : 'text-slate-400 hover:bg-[#101c3d] hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">File No.</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Net Profit</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => {
              const totals = computeWorkerTotals(w)
              return (
                <tr key={w.id} className="border-b border-[#122046] text-xs last:border-b-0 hover:bg-[#0d1838]">
                  <td className="px-4 py-3">
                    <Link to={`/workers/${w.id}`} className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                        {w.photoDataUrl ? (
                          <img src={w.photoDataUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <User className="size-4 text-slate-400" />
                        )}
                      </span>
                      <span className="font-medium text-slate-200 hover:text-amber-300">{w.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{w.fileNo}</td>
                  <td className="px-4 py-3 text-slate-400">{w.client}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-200">
                    {formatCurrency(totals.netProfit)} <span className="text-[10px] text-slate-500">SAR</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id, w.name)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                  No workers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddWorkerModal
          clients={clients.map((c) => c.contactName)}
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addWorker(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddWorkerModal({
  clients,
  onClose,
  onSubmit,
}: {
  clients: string[]
  onClose: () => void
  onSubmit: (data: {
    name: string
    client: string
    nationality: string
    age: number
    passportNo: string
    contractType: string
    mobileNo: string
  }) => void
}) {
  const [name, setName] = useState('')
  const [client, setClient] = useState(clients[0] ?? '')
  const [nationality, setNationality] = useState('Philippines')
  const [age, setAge] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [contractType, setContractType] = useState('2 Years')
  const [mobileNo, setMobileNo] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !passportNo.trim()) return
    onSubmit({
      name: name.trim(),
      client,
      nationality,
      age: Number(age) || 0,
      passportNo: passportNo.trim(),
      contractType,
      mobileNo,
    })
  }

  return (
    <Modal title="Add Worker" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>
        <Field label="Client">
          <SelectInput value={client} onChange={(e) => setClient(e.target.value)}>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nationality">
            <TextInput value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </Field>
          <Field label="Age">
            <TextInput type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Passport No.">
            <TextInput value={passportNo} onChange={(e) => setPassportNo(e.target.value)} required />
          </Field>
          <Field label="Contract Type">
            <SelectInput value={contractType} onChange={(e) => setContractType(e.target.value)}>
              <option>1 Year</option>
              <option>2 Years</option>
              <option>3 Years</option>
            </SelectInput>
          </Field>
        </div>
        <Field label="Mobile No.">
          <TextInput value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="+966 5x xxx xxxx" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Add Worker</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
