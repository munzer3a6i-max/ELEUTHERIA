import { useState } from 'react'
import ExpensesTable from './ExpensesTable'
import IncomeTable from './IncomeTable'
import StageBreakdownPanel from './StageBreakdownPanel'
import type { Worker } from '../../../types'

const subTabs = ['Expenses (Costs)', 'Income (From Client)', 'Payments History'] as const

export default function FinancialCenter({ worker }: { worker: Worker }) {
  const [activeSubTab, setActiveSubTab] = useState<(typeof subTabs)[number]>('Expenses (Costs)')

  return (
    <div>
      <div className="mb-4 flex items-center gap-6 border-b border-[#18274d] pb-1.5">
        {subTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2 text-xs transition-colors ${
              activeSubTab === tab
                ? 'border-b-2 border-amber-500 font-bold text-amber-400'
                : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9 flex flex-col gap-4">
          {activeSubTab === 'Expenses (Costs)' && <ExpensesTable worker={worker} />}
          {activeSubTab === 'Income (From Client)' && <IncomeTable worker={worker} />}
          {activeSubTab === 'Payments History' && (
            <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-[13px]">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-slate-200">
                Payments History
              </h2>
              <div className="flex flex-col divide-y divide-[#122046] text-xs">
                {[...worker.expenses.map((e) => ({ ...e, kind: 'Expense' as const, label: e.stage })), ...worker.incomePayments.map((p) => ({ ...p, kind: 'Income' as const, label: p.name }))]
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((row) => (
                    <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-slate-200">{row.label}</p>
                        <p className="text-[10px] text-slate-500">{row.date}</p>
                      </div>
                      <span
                        className={`text-xs font-bold ${row.kind === 'Income' ? 'text-emerald-400' : 'text-rose-500'}`}
                      >
                        {row.kind === 'Income' ? '+' : '−'} {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                      </span>
                    </div>
                  ))}
                {worker.expenses.length === 0 && worker.incomePayments.length === 0 && (
                  <p className="py-4 text-center text-slate-500">No transactions yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="col-span-3">
          <StageBreakdownPanel worker={worker} />
        </div>
      </div>
    </div>
  )
}
