import { useRef } from 'react'
import { Camera, MoreHorizontal, User } from 'lucide-react'
import { computeWorkerTotals, formatCurrency, useAppStore } from '../../store/useAppStore'
import type { Worker, WorkerStatus } from '../../types'

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex h-4 items-center">
      <span className="w-24 shrink-0 text-[11px] text-slate-400">{label}</span>
      <span className="text-[11px] text-slate-200">{value}</span>
    </div>
  )
}

function MoneyLine({
  label,
  amount,
  color,
  bold,
  border,
}: {
  label: string
  amount: number
  color: string
  bold?: boolean
  border?: boolean
}) {
  return (
    <div className={`flex w-full items-center justify-between ${border ? 'border-t border-[#13224b] pt-[7px]' : ''}`}>
      <span className={`text-xs ${bold ? 'font-bold' : ''}`} style={{ color: bold ? color : '#94a3b8' }}>
        {label}
      </span>
      <span className={`text-xs tracking-[0.3px] ${bold ? 'font-bold' : ''}`} style={{ color }}>
        {formatCurrency(amount)} <span className="text-[10px]">SAR</span>
      </span>
    </div>
  )
}

const STATUS_OPTIONS: WorkerStatus[] = ['In Process', 'Deployed', 'On Hold', 'Cancelled']

export default function WorkerHeader({ worker }: { worker: Worker }) {
  const setWorkerStatus = useAppStore((s) => s.setWorkerStatus)
  const setWorkerPhoto = useAppStore((s) => s.setWorkerPhoto)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { totalExpenses, totalIncome, netProfit, profitMargin } = computeWorkerTotals(worker)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setWorkerPhoto(worker.id, reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-8 flex items-center gap-5 rounded-lg border border-[#162650] bg-[#0a142f] p-[17px]">
        <div className="flex flex-col items-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/50 bg-slate-800 p-1 shadow-md">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-slate-700">
              {worker.photoDataUrl ? (
                <img src={worker.photoDataUrl} alt={worker.name} className="size-full object-cover" />
              ) : (
                <User className="size-10 text-slate-400" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex items-center gap-1 rounded border border-[#23386d] bg-[#122146] px-2.5 py-1 text-[10px] text-slate-300 shadow-sm hover:border-amber-500/40"
          >
            <Camera className="size-3" /> Change Photo
          </button>
        </div>

        <div className="flex-1">
          <div className="mb-2.5 flex items-center gap-3">
            <h1 className="text-lg font-bold uppercase tracking-[0.45px] text-white">{worker.name}</h1>
            <select
              value={worker.status}
              onChange={(e) => setWorkerStatus(worker.id, e.target.value as WorkerStatus)}
              className="rounded border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <MetaRow label="File No." value={worker.fileNo} />
            <MetaRow label="Client" value={worker.client} />
            <MetaRow label="Nationality" value={worker.nationality} />
            <MetaRow label="Contract Type" value={worker.contractType} />
            <MetaRow label="Age" value={`${worker.age} Years Old`} />
            <MetaRow
              label="Current Stage"
              value={
                <span className="rounded border border-blue-500/50 bg-blue-900/60 px-2.5 py-0.5 text-[10px] text-blue-300">
                  {worker.stages.find((s) => s.status === 'current')?.label ?? 'Deployed'}
                </span>
              }
            />
            <MetaRow label="Passport No." value={worker.passportNo} />
            <MetaRow label="Mobile No." value={worker.mobileNo || '—'} />
          </div>
        </div>
      </div>

      <div className="col-span-4 flex flex-col justify-between rounded-lg border border-[#162650] bg-[#0a142f] p-[17px]">
        <div className="flex items-center justify-between border-b border-[#14234b] pb-[9px]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.55px] text-slate-300">Financial Summary</h2>
          <button type="button" className="text-slate-400 hover:text-slate-200">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 py-2">
          <MoneyLine label="Total Expenses" amount={totalExpenses} color="#f43f5e" />
          <MoneyLine label="Total Income" amount={totalIncome} color="#34d399" />
          <MoneyLine label="Net Profit" amount={netProfit} color="#fbbf24" bold border />
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-slate-400">Profit Margin</span>
            <span className="text-xs font-bold text-sky-400">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>
        <div className="border-t border-[#122045] pt-[5px] text-right text-[9px] text-slate-500">
          Updated {worker.updatedOn} by {worker.updatedBy}
        </div>
      </div>
    </div>
  )
}
