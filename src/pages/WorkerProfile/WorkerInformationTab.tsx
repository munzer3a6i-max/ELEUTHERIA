import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Field, TextInput, SelectInput, PrimaryButton } from '../../components/form'
import type { Worker } from '../../types'

export default function WorkerInformationTab({ worker }: { worker: Worker }) {
  const updateWorker = useAppStore((s) => s.updateWorker)
  const [form, setForm] = useState({
    name: worker.name,
    client: worker.client,
    nationality: worker.nationality,
    age: String(worker.age),
    passportNo: worker.passportNo,
    contractType: worker.contractType,
    mobileNo: worker.mobileNo,
  })
  const [saved, setSaved] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateWorker(worker.id, {
      name: form.name.trim(),
      client: form.client.trim(),
      nationality: form.nationality.trim(),
      age: Number(form.age) || 0,
      passportNo: form.passportNo.trim(),
      contractType: form.contractType,
      mobileNo: form.mobileNo.trim(),
    })
    setSaved(true)
  }

  return (
    <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-5">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3px] text-slate-200">Worker Information</h2>
      <form onSubmit={handleSubmit} className="grid max-w-2xl grid-cols-2 gap-x-4">
        <Field label="Full Name">
          <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <Field label="Client">
          <TextInput value={form.client} onChange={(e) => set('client', e.target.value)} required />
        </Field>
        <Field label="Nationality">
          <TextInput value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
        </Field>
        <Field label="Age">
          <TextInput type="number" min={18} value={form.age} onChange={(e) => set('age', e.target.value)} />
        </Field>
        <Field label="Passport No.">
          <TextInput value={form.passportNo} onChange={(e) => set('passportNo', e.target.value)} required />
        </Field>
        <Field label="Contract Type">
          <SelectInput value={form.contractType} onChange={(e) => set('contractType', e.target.value)}>
            <option>1 Year</option>
            <option>2 Years</option>
            <option>3 Years</option>
          </SelectInput>
        </Field>
        <Field label="Mobile No.">
          <TextInput value={form.mobileNo} onChange={(e) => set('mobileNo', e.target.value)} placeholder="+966 5x xxx xxxx" />
        </Field>
        <Field label="File No. (auto-generated)">
          <TextInput value={worker.fileNo} disabled className="opacity-60" />
        </Field>

        <div className="col-span-2 mt-2 flex items-center gap-3">
          <PrimaryButton type="submit">Save Changes</PrimaryButton>
          {saved && <span className="text-[11px] text-emerald-400">Saved.</span>}
        </div>
      </form>
    </div>
  )
}
