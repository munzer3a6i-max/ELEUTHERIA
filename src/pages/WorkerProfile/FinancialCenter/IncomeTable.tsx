import { Paperclip, Pencil, Trash2, Plus } from 'lucide-react'
import { incomePayments, totalIncome, formatCurrency } from '../../../data/workerProfile'

const headers = [
  { label: '#', className: 'w-8' },
  { label: 'Payment Name', className: 'w-32' },
  { label: 'Date', className: 'w-24' },
  { label: 'Payment Type', className: 'w-28' },
  { label: 'Amount (SAR)', className: 'w-24 text-right' },
  { label: 'Receipt / Attachment', className: 'w-40' },
  { label: 'Action', className: 'w-16 text-center' },
]

export default function IncomeTable() {
  return (
    <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-[13px]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.55px] text-slate-300">Income From Client</h2>
        <button
          type="button"
          className="flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-600"
        >
          <Plus className="size-2.5" /> Add Payment
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#14234b]">
              {headers.map((h) => (
                <th key={h.label} className={`px-2 pb-3.5 pt-2 text-[10.5px] font-semibold text-slate-400 ${h.className ?? ''}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incomePayments.map((row) => (
              <tr key={row.id} className="border-t border-[#122046] first:border-t-0">
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{row.id}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-200">{row.name}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{row.date}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{row.type}</td>
                <td className="px-2 py-3.5 text-right text-[10.5px] text-slate-200">{formatCurrency(row.amount)}</td>
                <td className="px-2 py-3.5">
                  <span className="flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-slate-200">
                    <Paperclip className="size-3" /> {row.receiptName}
                  </span>
                </td>
                <td className="px-2 py-3.5">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    <button type="button" className="hover:text-amber-400">
                      <Pencil className="size-3" />
                    </button>
                    <button type="button" className="hover:text-rose-400">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-[#14234b] pt-2.5">
        <span className="text-xs font-bold uppercase tracking-[0.3px] text-emerald-400">Total Income</span>
        <span className="text-sm font-bold tracking-[0.35px] text-emerald-400">
          {formatCurrency(totalIncome)} <span className="text-xs">SAR</span>
        </span>
      </div>
    </div>
  )
}
