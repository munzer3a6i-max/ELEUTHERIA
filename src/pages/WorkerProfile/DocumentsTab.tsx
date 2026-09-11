import { useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { SelectInput } from '../../components/form'
import type { Worker } from '../../types'

const CATEGORIES = ['Identification', 'Medical', 'Contract', 'Training', 'Travel', 'Other']

export default function DocumentsTab({ worker }: { worker: Worker }) {
  const addDocument = useAppStore((s) => s.addDocument)
  const deleteDocument = useAppStore((s) => s.deleteDocument)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState(CATEGORIES[0])

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      addDocument(worker.id, { name: file.name, category })
    }
    e.target.value = ''
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete document "${name}"?`)) {
      deleteDocument(worker.id, id)
    }
  }

  return (
    <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-slate-200">Documents</h2>
        <div className="flex items-center gap-2">
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)} className="w-40">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelected} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-500"
          >
            <Upload className="size-3.5" /> Upload Document
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[#122046]">
        {worker.documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-200">{doc.name}</p>
                <p className="text-[10px] text-slate-500">
                  {doc.category} · Uploaded {doc.uploadedOn}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => handleDelete(doc.id, doc.name)} className="text-slate-400 hover:text-rose-400">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {worker.documents.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  )
}
