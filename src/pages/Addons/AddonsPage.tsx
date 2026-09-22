import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { allStatusDefinitions } from '../../data/statusPipelines'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { BilingualField, Field, SelectInput, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { PaymentSourceScope } from '../../types'

const TABS = ['countries', 'cities', 'professions', 'payment-sources', 'statuses'] as const
type Tab = (typeof TABS)[number]

export default function AddonsPage() {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : 'countries'

  const labels: Record<Tab, string> = {
    countries: language === 'ar' ? 'الدول' : 'Countries',
    cities: language === 'ar' ? 'المدن' : 'Cities',
    professions: language === 'ar' ? 'المهن' : 'Professions',
    'payment-sources': language === 'ar' ? 'مصادر الدفع' : 'Payment Sources',
    statuses: language === 'ar' ? 'الحالات' : 'Statuses',
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t('nav_addons')} subtitle={language === 'ar' ? 'بيانات الإعدادات المشتركة' : 'Shared configuration data'} />

      <div className="flex items-center gap-1 border-b border-line pb-1.5">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => navigate(`/addons/${tb}`)}
            className={`rounded-control px-3 py-1.5 text-[11px] ${
              activeTab === tb ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-raised'
            }`}
          >
            {labels[tb]}
          </button>
        ))}
      </div>

      {activeTab === 'countries' && <CountriesTab />}
      {activeTab === 'cities' && <CitiesTab />}
      {activeTab === 'professions' && <ProfessionsTab />}
      {activeTab === 'payment-sources' && <PaymentSourcesTab />}
      {activeTab === 'statuses' && <StatusesTab />}
    </div>
  )
}

function ConfigList({
  items,
  onDelete,
  onAdd,
  addLabel,
}: {
  items: { id: string; label: string }[]
  onDelete: (id: string) => void
  onAdd: () => void
  addLabel: string
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <div className="mb-3 flex justify-end">
        <PrimaryButton onClick={onAdd} className="flex items-center gap-1.5">
          <Plus className="size-3.5" /> {addLabel}
        </PrimaryButton>
      </div>
      <div className="flex flex-col divide-y divide-line">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between py-2.5 text-xs">
            <span className="text-ink">{it.label}</span>
            <button type="button" onClick={() => onDelete(it.id)} className="text-ink-3 hover:text-neg">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-[11px] text-ink-3">{t('action_search')}...</p>}
      </div>
    </div>
  )
}

function CountriesTab() {
  const countries = useAppStore((s) => s.countries)
  const addCountry = useAppStore((s) => s.addCountry)
  const deleteCountry = useAppStore((s) => s.deleteCountry)
  const { tb, language } = useTranslation()
  const [open, setOpen] = useState(false)
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')

  return (
    <>
      <ConfigList
        items={countries.map((c) => ({ id: c.id, label: tb(c.name) }))}
        onDelete={deleteCountry}
        onAdd={() => setOpen(true)}
        addLabel={language === 'ar' ? 'إضافة دولة' : 'Add Country'}
      />
      {open && (
        <Modal title={language === 'ar' ? 'إضافة دولة' : 'Add Country'} onClose={() => setOpen(false)}>
          <BilingualField labelEn="English" labelAr="Arabic" valueEn={en} valueAr={ar} onChangeEn={setEn} onChangeAr={setAr} />
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                if (!en.trim()) return
                addCountry({ en: en.trim(), ar: ar.trim() })
                setOpen(false)
                setEn('')
                setAr('')
              }}
            >
              Add
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  )
}

function CitiesTab() {
  const cities = useAppStore((s) => s.cities)
  const countries = useAppStore((s) => s.countries)
  const addCity = useAppStore((s) => s.addCity)
  const deleteCity = useAppStore((s) => s.deleteCity)
  const { tb, language } = useTranslation()
  const [open, setOpen] = useState(false)
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')
  const [countryId, setCountryId] = useState(countries[0]?.id ?? '')

  return (
    <>
      <ConfigList
        items={cities.map((c) => ({ id: c.id, label: `${tb(c.name)} - ${tb(countries.find((co) => co.id === c.countryId)?.name ?? { en: '', ar: '' })}` }))}
        onDelete={deleteCity}
        onAdd={() => setOpen(true)}
        addLabel={language === 'ar' ? 'إضافة مدينة' : 'Add City'}
      />
      {open && (
        <Modal title={language === 'ar' ? 'إضافة مدينة' : 'Add City'} onClose={() => setOpen(false)}>
          <BilingualField labelEn="English" labelAr="Arabic" valueEn={en} valueAr={ar} onChangeEn={setEn} onChangeAr={setAr} />
          <Field label={language === 'ar' ? 'الدولة' : 'Country'}>
            <SelectInput value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.en}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                if (!en.trim() || !countryId) return
                addCity({ name: { en: en.trim(), ar: ar.trim() }, countryId })
                setOpen(false)
                setEn('')
                setAr('')
              }}
            >
              Add
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  )
}

function ProfessionsTab() {
  const professions = useAppStore((s) => s.professions)
  const addProfession = useAppStore((s) => s.addProfession)
  const deleteProfession = useAppStore((s) => s.deleteProfession)
  const { tb, language } = useTranslation()
  const [open, setOpen] = useState(false)
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')

  return (
    <>
      <ConfigList
        items={professions.map((p) => ({ id: p.id, label: tb(p.name) }))}
        onDelete={deleteProfession}
        onAdd={() => setOpen(true)}
        addLabel={language === 'ar' ? 'إضافة مهنة' : 'Add Profession'}
      />
      {open && (
        <Modal title={language === 'ar' ? 'إضافة مهنة' : 'Add Profession'} onClose={() => setOpen(false)}>
          <BilingualField labelEn="English" labelAr="Arabic" valueEn={en} valueAr={ar} onChangeEn={setEn} onChangeAr={setAr} />
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                if (!en.trim()) return
                addProfession({ en: en.trim(), ar: ar.trim() })
                setOpen(false)
                setEn('')
                setAr('')
              }}
            >
              Add
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  )
}

function PaymentSourcesTab() {
  const sources = useAppStore((s) => s.paymentSources)
  const addPaymentSource = useAppStore((s) => s.addPaymentSource)
  const updatePaymentSource = useAppStore((s) => s.updatePaymentSource)
  const deletePaymentSource = useAppStore((s) => s.deletePaymentSource)
  const { language } = useTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<PaymentSourceScope[]>(['Invoices', 'Request Status'])

  function toggleScope(id: string, scope: PaymentSourceScope) {
    const source = sources.find((s) => s.id === id)
    if (!source) return
    const next = source.scopes.includes(scope) ? source.scopes.filter((s) => s !== scope) : [...source.scopes, scope]
    updatePaymentSource(id, { scopes: next })
  }

  return (
    <>
      <div className="rounded-panel border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] text-ink-3">
            {language === 'ar'
              ? 'قائمة واحدة، حدد النطاق بدلاً من تكرار المصدر لكل وحدة.'
              : 'One list - tag scope per source instead of duplicating it per module.'}
          </p>
          <PrimaryButton onClick={() => setOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة مصدر' : 'Add Source'}
          </PrimaryButton>
        </div>
        <div className="flex flex-col divide-y divide-line">
          {sources.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-ink">{s.name}</span>
              <div className="flex items-center gap-4">
                {(['Invoices', 'Request Status'] as PaymentSourceScope[]).map((scope) => (
                  <label key={scope} className="flex items-center gap-1.5 text-[10.5px] text-ink-2">
                    <input type="checkbox" checked={s.scopes.includes(scope)} onChange={() => toggleScope(s.id, scope)} />
                    {scope}
                  </label>
                ))}
                <button type="button" onClick={() => deletePaymentSource(s.id)} className="text-ink-3 hover:text-neg">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <Modal title={language === 'ar' ? 'إضافة مصدر دفع' : 'Add Payment Source'} onClose={() => setOpen(false)}>
          <Field label={language === 'ar' ? 'الاسم' : 'Name'}>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <div className="mb-3 flex items-center gap-4">
            {(['Invoices', 'Request Status'] as PaymentSourceScope[]).map((scope) => (
              <label key={scope} className="flex items-center gap-1.5 text-[11px] text-ink-2">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={(e) => setScopes((prev) => (e.target.checked ? [...prev, scope] : prev.filter((s) => s !== scope)))}
                />
                {scope}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                if (!name.trim() || scopes.length === 0) return
                addPaymentSource({ name: name.trim(), scopes })
                setOpen(false)
                setName('')
              }}
            >
              Add
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  )
}

function StatusesTab() {
  const { language } = useTranslation()
  const [pipelineFilter, setPipelineFilter] = useState<'Domestic' | 'Profession' | 'Invoice'>('Domestic')
  const filtered = allStatusDefinitions.filter((s) => s.pipeline === pipelineFilter).sort((a, b) => a.order - b.order)
  const counts = {
    Domestic: allStatusDefinitions.filter((s) => s.pipeline === 'Domestic').length,
    Profession: allStatusDefinitions.filter((s) => s.pipeline === 'Profession').length,
    Invoice: allStatusDefinitions.filter((s) => s.pipeline === 'Invoice').length,
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-ink-3">
          {language === 'ar' ? 'ثلاثة مسارات منفصلة' : 'Three separate pipelines'} - {counts.Domestic} {language === 'ar' ? 'منزلي' : 'Domestic'} + {counts.Profession} {language === 'ar' ? 'مهني' : 'Profession'} + {counts.Invoice} {language === 'ar' ? 'فواتير' : 'Invoice'} = {counts.Domestic + counts.Profession + counts.Invoice} {language === 'ar' ? 'إجمالي' : 'total'}
        </p>
        <div className="flex items-center gap-1">
          {(['Domestic', 'Profession', 'Invoice'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPipelineFilter(p)}
              className={`rounded-control px-2.5 py-1.5 text-[11px] ${
                pipelineFilter === p ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-raised'
              }`}
            >
              {p === 'Domestic' ? (language === 'ar' ? 'منزلي' : 'Domestic') : p === 'Profession' ? (language === 'ar' ? 'مهني' : 'Profession') : (language === 'ar' ? 'فواتير' : 'Invoice')}
            </button>
          ))}
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th className="py-2 pe-3">#</th>
            <th className="py-2 pe-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
            <th className="py-2 pe-3">{language === 'ar' ? 'التكلفة الافتراضية' : 'Default Cost'}</th>
            <th className="py-2">{language === 'ar' ? 'ملاحظة' : 'Note'}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id} className="text-xs">
              <td className="py-2 pe-3 text-ink-3">{s.order || '-'}</td>
              <td className="py-2 pe-3 text-ink">
                {s.label}
                {s.isException && <span className="ms-1.5 rounded-control bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent-text">exception</span>}
                {s.isTerminal && !s.isException && <span className="ms-1.5 rounded-control bg-pos/20 px-1.5 py-0.5 text-[9px] text-pos">terminal</span>}
              </td>
              <td className="py-2 pe-3 text-ink-2">{s.defaultCost > 0 ? `$${s.defaultCost.toFixed(2)}` : '-'}</td>
              <td className="py-2 text-ink-3">{s.costNote}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
