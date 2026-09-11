import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'

export default function DocumentsPage() {
  const workers = useAppStore((s) => s.workers)

  const rows = useMemo(() => {
    return workers
      .flatMap((w) => w.documents.map((d) => ({ ...d, workerId: w.id, workerName: w.name })))
      .sort((a, b) => (a.uploadedOn < b.uploadedOn ? 1 : -1))
  }, [workers])

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Documents" subtitle="All uploaded documents across every worker" />

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-slate-200">
                    <FileText className="size-3.5 text-slate-500" /> {d.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/workers/${d.workerId}`} className="text-slate-300 hover:text-amber-300">
                    {d.workerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-400">{d.category}</td>
                <td className="px-4 py-3 text-slate-400">{d.uploadedOn}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
