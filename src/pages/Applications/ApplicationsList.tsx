import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { Application, ApplicationStatus } from '../../types'

const STATUS_OPTIONS: ApplicationStatus[] = ['New', 'Screening', 'Interview', 'Approved', 'Rejected']

export default function ApplicationsList() {
  const applications = useAppStore((s) => s.applications)
  const clients = useAppStore((s) => s.clients)
  const addApplication = useAppStore((s) => s.addApplication)
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus)
  const deleteApplication = useAppStore((s) => s.deleteApplication)
  const [addOpen, setAddOpen] = useState(false)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete application for "${name}"?`)) {
      deleteApplication(id)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title="Applications"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> New Application
          </PrimaryButton>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date Applied</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-200">{a.applicantName}</td>
                <td className="px-4 py-3 text-slate-400">{a.position}</td>
                <td className="px-4 py-3 text-slate-400">{a.client}</td>
                <td className="px-4 py-3 text-slate-400">{a.dateApplied}</td>
                <td className="px-4 py-3">
                  <select
                    value={a.status}
                    onChange={(e) => updateApplicationStatus(a.id, e.target.value as ApplicationStatus)}
                    className="rounded border border-[#1b2b54] bg-[#0d1836] px-2 py-1 text-[10.5px] text-slate-200 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id, a.applicantName)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddApplicationModal
          clients={clients.map((c) => c.contactName)}
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addApplication(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddApplicationModal({
  clients,
  onClose,
  onSubmit,
}: {
  clients: string[]
  onClose: () => void
  onSubmit: (data: Omit<Application, 'id'>) => void
}) {
  const [applicantName, setApplicantName] = useState('')
  const [position, setPosition] = useState('Household Worker')
  const [client, setClient] = useState(clients[0] ?? '')
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().slice(0, 10))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!applicantName.trim()) return
    onSubmit({ applicantName: applicantName.trim(), position, client, status: 'New', dateApplied })
  }

  return (
    <Modal title="New Application" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Applicant Name">
          <TextInput value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required autoFocus />
        </Field>
        <Field label="Position">
          <SelectInput value={position} onChange={(e) => setPosition(e.target.value)}>
            <option>Household Worker</option>
            <option>Caregiver</option>
            <option>Driver</option>
            <option>Cook</option>
            <option>Nanny</option>
          </SelectInput>
        </Field>
        <Field label="Client">
          <SelectInput value={client} onChange={(e) => setClient(e.target.value)}>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Date Applied">
          <TextInput type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Create Application</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
