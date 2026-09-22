import { useState } from 'react'
import { useAppStore } from '../../../../store/useAppStore'
import { useTranslation } from '../../../../i18n/useTranslation'
import ExpensesTable from './ExpensesTable'
import IncomeTable from './IncomeTable'
import StageBreakdownPanel from './StageBreakdownPanel'
import type { Applicant, RecruitmentRequest } from '../../../../types'

export default function FinancialCenter({
  applicant,
  activeRequest,
}: {
  applicant: Applicant
  activeRequest: RecruitmentRequest | null
}) {
  const invoices = useAppStore((s) => s.invoices)
  const addInvoice = useAppStore((s) => s.addInvoice)
  const { language } = useTranslation()
  const subTabs = [
    language === 'ar' ? 'المصروفات (التكاليف)' : 'Expenses (Costs)',
    language === 'ar' ? 'الدخل (من العميل)' : 'Income (From Client)',
    language === 'ar' ? 'سجل المدفوعات' : 'Payments History',
  ] as const
  const [activeSubTab, setActiveSubTab] = useState<(typeof subTabs)[number]>(subTabs[0])

  if (!activeRequest) {
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="mb-1 text-sm text-ink">
          {language === 'ar' ? 'لا يوجد طلب استقدام مرتبط بهذا المتقدم بعد.' : 'This applicant has no recruitment request yet.'}
        </p>
        <p className="text-xs text-ink-3">
          {language === 'ar' ? 'لا توجد بيانات مالية لعرضها حتى يتم إنشاء طلب.' : 'No financials to show until a request is created.'}
        </p>
      </div>
    )
  }

  const invoice = invoices.find((i) => i.recruitmentRequestId === activeRequest.id) ?? null

  function handleCreateInvoice() {
    addInvoice({
      recruitmentRequestId: activeRequest!.id,
      employerId: activeRequest!.employerId,
      recruitmentAgencyId: activeRequest!.recruitmentAgencyId,
      servicePrice: 500,
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-6 border-b border-line pb-1.5">
        {subTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2 text-xs transition-colors ${
              activeSubTab === tab
                ? 'border-b-2 border-accent-line font-bold text-accent-text'
                : 'border-b-2 border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9 flex flex-col gap-4">
          {activeSubTab === subTabs[0] && <ExpensesTable request={activeRequest} />}
          {activeSubTab === subTabs[1] && <IncomeTable invoice={invoice} onCreateInvoice={handleCreateInvoice} />}
          {activeSubTab === subTabs[2] && (
            <div className="rounded-panel border border-line bg-surface p-[13px]">
              <h2 className="mb-3 panel-title">
                {language === 'ar' ? 'سجل المدفوعات' : 'Payments History'}
              </h2>
              <div className="flex flex-col divide-y divide-line text-xs">
                {[
                  ...activeRequest.statusHistory.map((h) => ({ id: h.id, label: h.status, date: h.date, amount: h.cost, kind: 'Expense' as const })),
                  ...(invoice?.payments.map((p) => ({ id: p.id, label: applicant.englishName, date: p.date, amount: p.amount, kind: 'Income' as const })) ?? []),
                ]
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((row) => (
                    <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-ink">{row.label}</p>
                        <p className="text-[10px] text-ink-3">{row.date}</p>
                      </div>
                      <span className={`text-xs font-bold ${row.kind === 'Income' ? 'text-pos' : 'text-neg'}`}>
                        {row.kind === 'Income' ? '+' : '−'} ${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                {activeRequest.statusHistory.length === 0 && (invoice?.payments.length ?? 0) === 0 && (
                  <p className="py-4 text-center text-ink-3">
                    {language === 'ar' ? 'لا توجد معاملات بعد.' : 'No transactions yet.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="col-span-3">
          <StageBreakdownPanel request={activeRequest} invoice={invoice} />
        </div>
      </div>
    </div>
  )
}
