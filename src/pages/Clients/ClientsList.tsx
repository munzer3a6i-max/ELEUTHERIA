import { useState } from 'react'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'

export default function ClientsList() {
  const clients = useAppStore((s) => s.clients)
  const addClient = useAppStore((s) => s.addClient)
  const deleteClient = useAppStore((s) => s.deleteClient)
  const [addOpen, setAddOpen] = useState(false)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete client "${name}"?`)) {
      deleteClient(id)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? '' : 's'}`}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add Client
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {clients.map((c) => (
          <div key={c.id} className="rounded-lg border border-[#162650] bg-[#0a142f] p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-full bg-slate-800">
                  <Building2 className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{c.company}</p>
                  <p className="text-[11px] text-slate-400">{c.contactName}</p>
                </div>
              </div>
              <button type="button" onClick={() => handleDelete(c.id, c.company)} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 text-[11px] text-slate-400">
              <p>{c.email}</p>
              <p>{c.phone}</p>
              <p>{c.country}</p>
            </div>
            <div className="mt-3 border-t border-[#122046] pt-2 text-[11px] text-slate-400">
              Active workers: <span className="text-amber-400">{c.activeWorkers}</span>
            </div>
          </div>
        ))}
      </div>

      {addOpen && (
        <AddClientModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addClient(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddClientModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: { company: string; contactName: string; email: string; phone: string; country: string }) => void
}) {
  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('Saudi Arabia')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !contactName.trim()) return
    onSubmit({ company: company.trim(), contactName: contactName.trim(), email: email.trim(), phone: phone.trim(), country })
  }

  return (
    <Modal title="Add Client" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Company / Household Name">
          <TextInput value={company} onChange={(e) => setCompany(e.target.value)} required autoFocus />
        </Field>
        <Field label="Contact Name">
          <TextInput value={contactName} onChange={(e) => setContactName(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" />
          </Field>
        </div>
        <Field label="Country">
          <TextInput value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Add Client</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
