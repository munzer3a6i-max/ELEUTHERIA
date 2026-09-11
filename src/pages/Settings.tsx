import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import PageHeader from '../components/PageHeader'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../components/form'

export default function Settings() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateSettings(form)
    setSaved(true)
  }

  function handleReset() {
    if (window.confirm('Reset all data to the demo defaults? This clears everything stored in your browser.')) {
      localStorage.removeItem('eleutheria-store')
      window.location.href = '/'
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Settings" subtitle="Company details and application preferences" />

      <div className="max-w-lg rounded-lg border border-[#162650] bg-[#0a142f] p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3px] text-slate-200">Company Profile</h2>
        <form onSubmit={handleSubmit}>
          <Field label="Company Name">
            <TextInput
              value={form.companyName}
              onChange={(e) => {
                setForm((f) => ({ ...f, companyName: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label="Tagline">
            <TextInput
              value={form.companyTagline}
              onChange={(e) => {
                setForm((f) => ({ ...f, companyTagline: e.target.value }))
                setSaved(false)
              }}
            />
          </Field>
          <Field label="Currency Code">
            <TextInput
              value={form.currency}
              maxLength={3}
              onChange={(e) => {
                setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))
                setSaved(false)
              }}
            />
          </Field>
          <div className="mt-2 flex items-center gap-3">
            <PrimaryButton type="submit">Save Changes</PrimaryButton>
            {saved && <span className="text-[11px] text-emerald-400">Saved.</span>}
          </div>
        </form>
      </div>

      <div className="max-w-lg rounded-lg border border-rose-900/60 bg-[#0a142f] p-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.3px] text-rose-400">Danger Zone</h2>
        <p className="mb-3 text-xs text-slate-400">
          This resets workers, clients, applications, staff, and notifications back to the original demo data.
        </p>
        <SecondaryButton onClick={handleReset} className="border-rose-900 text-rose-400 hover:border-rose-700">
          Reset Demo Data
        </SecondaryButton>
      </div>
    </div>
  )
}
