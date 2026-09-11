import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Printer, Send } from 'lucide-react'
import { useAppStore, computeWorkerTotals, formatCurrency } from '../../store/useAppStore'
import Breadcrumb from './Breadcrumb'
import WorkerHeader from './WorkerHeader'
import ProfileTabs from './ProfileTabs'
import RecruitmentTimeline from './RecruitmentTimeline'
import FinancialCenter from './FinancialCenter'
import StatusBarFooter from './StatusBarFooter'
import WorkerInformationTab from './WorkerInformationTab'
import StagesEditorTab from './StagesEditorTab'
import DocumentsTab from './DocumentsTab'
import NotesTab from './NotesTab'

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const worker = useAppStore((s) => s.workers.find((w) => w.id === id))

  if (!worker) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-slate-300">Worker not found.</p>
        <Link to="/workers" className="text-xs text-amber-400 hover:text-amber-300">
          Back to Workers
        </Link>
      </div>
    )
  }

  return <WorkerProfileContent key={worker.id} workerId={worker.id} onDeleted={() => navigate('/workers')} />
}

function WorkerProfileContent({ workerId, onDeleted }: { workerId: string; onDeleted: () => void }) {
  const worker = useAppStore((s) => s.workers.find((w) => w.id === workerId))
  const deleteWorker = useAppStore((s) => s.deleteWorker)
  const [activeTab, setActiveTab] = useState('financial')

  if (!worker) {
    onDeleted()
    return null
  }

  function handlePrint() {
    window.print()
  }

  function handleSendToClient() {
    const totals = computeWorkerTotals(worker!)
    const subject = encodeURIComponent(`Worker Profile Summary — ${worker!.name}`)
    const body = encodeURIComponent(
      `Worker: ${worker!.name}\nFile No.: ${worker!.fileNo}\nClient: ${worker!.client}\n\n` +
        `Total Expenses: ${formatCurrency(totals.totalExpenses)} SAR\n` +
        `Total Income: ${formatCurrency(totals.totalIncome)} SAR\n` +
        `Net Profit: ${formatCurrency(totals.netProfit)} SAR`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  function handleDeleteWorker() {
    if (window.confirm(`Delete ${worker!.name}? This cannot be undone.`)) {
      deleteWorker(worker!.id)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Breadcrumb workerName={worker.name} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded border border-[#1f3366] bg-[#101c3d] px-3 py-1.5 text-[11px] text-slate-300 hover:border-[#2c4685]"
          >
            <Printer className="size-3.5" /> Print
          </button>
          <button
            type="button"
            onClick={handleSendToClient}
            className="flex items-center gap-1.5 rounded border border-[#1f3366] bg-[#101c3d] px-3 py-1.5 text-[11px] text-slate-300 hover:border-[#2c4685]"
          >
            <Send className="size-3.5" /> Send to Client
          </button>
          <button
            type="button"
            onClick={handleDeleteWorker}
            className="rounded border border-rose-900 bg-rose-950/60 px-3 py-1.5 text-[11px] text-rose-400 hover:border-rose-700"
          >
            Delete Worker
          </button>
        </div>
      </div>

      <WorkerHeader worker={worker} />
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'financial' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <RecruitmentTimeline worker={worker} onEditStages={() => setActiveTab('stages')} />
          </div>
          <div className="col-span-9">
            <FinancialCenter worker={worker} />
          </div>
        </div>
      )}
      {activeTab === 'info' && <WorkerInformationTab worker={worker} />}
      {activeTab === 'stages' && <StagesEditorTab worker={worker} />}
      {activeTab === 'documents' && <DocumentsTab worker={worker} />}
      {activeTab === 'notes' && <NotesTab worker={worker} />}

      <StatusBarFooter worker={worker} />
    </div>
  )
}
