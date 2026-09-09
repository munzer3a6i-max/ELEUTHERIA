import { worker } from '../../data/workerProfile'

export default function StatusBarFooter() {
  return (
    <div className="flex items-center justify-between border-t border-[#152347] pt-3 text-[10px] text-slate-500">
      <p>
        <span className="text-slate-400">Note:</span> All amounts are in Saudi Riyal (SAR)
      </p>
      <p>
        Created: {worker.createdOn} | Last Updated: {worker.lastUpdated} by {worker.updatedBy}
      </p>
    </div>
  )
}
