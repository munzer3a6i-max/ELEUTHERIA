import { useState } from 'react'
import { Plus, Trash2, UserCog } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { StaffMember, StaffRole } from '../../types'

const ROLES: StaffRole[] = ['Administrator', 'Recruiter', 'Accountant', 'Coordinator']

export default function StaffList() {
  const staff = useAppStore((s) => s.staff)
  const addStaff = useAppStore((s) => s.addStaff)
  const toggleStaffActive = useAppStore((s) => s.toggleStaffActive)
  const deleteStaff = useAppStore((s) => s.deleteStaff)
  const [addOpen, setAddOpen] = useState(false)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Remove staff member "${name}"?`)) {
      deleteStaff(id)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title="Staff"
        subtitle={`${staff.length} team member${staff.length === 1 ? '' : 's'}`}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add Staff
          </PrimaryButton>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m) => (
              <tr key={m.id} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5 text-slate-200">
                    <span className="flex size-7 items-center justify-center rounded-full bg-slate-700">
                      <UserCog className="size-3.5 text-slate-300" />
                    </span>
                    {m.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{m.role}</td>
                <td className="px-4 py-3 text-slate-400">{m.email}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleStaffActive(m.id)}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      m.active ? 'bg-emerald-950/80 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(m.id, m.name)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddStaffModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addStaff(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddStaffModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: Omit<StaffMember, 'id' | 'active'>) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('Recruiter')
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    onSubmit({ name: name.trim(), role, email: email.trim() })
  }

  return (
    <Modal title="Add Staff" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>
        <Field label="Role">
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Add Staff</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
