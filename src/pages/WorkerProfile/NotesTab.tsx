import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { TextArea, PrimaryButton } from '../../components/form'
import type { Worker } from '../../types'

export default function NotesTab({ worker }: { worker: Worker }) {
  const addNote = useAppStore((s) => s.addNote)
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    addNote(worker.id, text.trim())
    setText('')
  }

  return (
    <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-5">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3px] text-slate-200">Notes &amp; History</h2>

      <form onSubmit={handleSubmit} className="mb-5">
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Add a note about this worker..."
          className="mb-2"
        />
        <PrimaryButton type="submit" disabled={!text.trim()}>
          Add Note
        </PrimaryButton>
      </form>

      <div className="flex flex-col divide-y divide-[#122046]">
        {worker.notes.map((note) => (
          <div key={note.id} className="py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">{note.author}</span>
              <span className="text-[10px] text-slate-500">{note.date}</span>
            </div>
            <p className="text-xs text-slate-400">{note.text}</p>
          </div>
        ))}
        {worker.notes.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">No notes yet.</p>
        )}
      </div>
    </div>
  )
}
