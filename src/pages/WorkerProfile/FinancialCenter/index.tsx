import { useState } from 'react'
import ExpensesTable from './ExpensesTable'
import IncomeTable from './IncomeTable'
import StageBreakdownPanel from './StageBreakdownPanel'

const subTabs = ['Expenses (Costs)', 'Income (From Client)', 'Payments History'] as const

export default function FinancialCenter() {
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
          <ExpensesTable />
          <IncomeTable />
        </div>
        <div className="col-span-3">
          <StageBreakdownPanel />
        </div>
      </div>
    </div>
  )
}
