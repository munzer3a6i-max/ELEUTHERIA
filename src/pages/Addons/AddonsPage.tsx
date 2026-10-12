import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useAppStore, useStatusDefinitions } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { BilingualField, Field, SelectInput, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { PaymentSourceScope, StatusDefinition } from '../../types'

const TABS = ['countries', 'cities', 'professions', 'managers', 'expense-categories', 'payment-sources', 'statuses'] as const
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
    managers: t('addons_managers'),
    'expense-categories': t('addons_expense_categories'),
    'payment-sources': language === 'ar' ? 'مصادر الدفع' : 'Payment Sources',
    statuses: language === 'ar' ? 'الحالات' : 'Statuses',
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t('nav_addons')} subtitle={language === 'ar' ? 'بيانات الإعدادات المشتركة' : 'Shared configuration data'} />

      <div className="flex flex-wrap items-center gap-1 border-b border-line pb-1.5">
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
      {activeTab === 'managers' && <ManagersTab />}
      {activeTab === 'expense-categories' && <ExpenseCategoriesTab />}
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

/**
 * A list of names in two languages, added and removed. Managers and expense
 * categories are the same shape, and the only difference worth writing twice
 * is what removing one means -- so that is a sentence, not a second component.
 */
function NameListTab({
  items,
  onAdd,
  onDelete,
  addLabel,
  note,
}: {
  items: { id: string; label: string }[]
  onAdd: (name: { en: string; ar: string }) => void
  onDelete: (id: string) => void
  addLabel: string
  note?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')

  return (
    <>
      {note && <p className="text-[11px] text-ink-3">{note}</p>}
      <ConfigList items={items} onDelete={onDelete} onAdd={() => setOpen(true)} addLabel={addLabel} />
      {open && (
        <Modal title={addLabel} onClose={() => setOpen(false)}>
          <BilingualField labelEn="English" labelAr="Arabic" valueEn={en} valueAr={ar} onChangeEn={setEn} onChangeAr={setAr} />
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>{t('action_cancel')}</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                if (!en.trim()) return
                onAdd({ en: en.trim(), ar: ar.trim() })
                setOpen(false)
                setEn('')
                setAr('')
              }}
            >
              {t('action_add')}
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </>
  )
}

function ManagersTab() {
  const managers = useAppStore((s) => s.managers)
  const addManager = useAppStore((s) => s.addManager)
  const deleteManager = useAppStore((s) => s.deleteManager)
  const { t, tb } = useTranslation()

  return (
    <NameListTab
      items={managers.map((m) => ({ id: m.id, label: tb(m.name) }))}
      onAdd={addManager}
      onDelete={deleteManager}
      addLabel={t('addons_add_manager')}
      note={t('label_manager_hint')}
    />
  )
}

function ExpenseCategoriesTab() {
  const categories = useAppStore((s) => s.expenseCategories)
  const addExpenseCategory = useAppStore((s) => s.addExpenseCategory)
  const deleteExpenseCategory = useAppStore((s) => s.deleteExpenseCategory)
  const { t, tb } = useTranslation()

  return (
    <NameListTab
      items={categories.map((c) => ({ id: c.id, label: tb(c.name) }))}
      onAdd={addExpenseCategory}
      onDelete={deleteExpenseCategory}
      addLabel={t('addons_add_category')}
    />
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
  const definitions = useStatusDefinitions()
  const addStatusDefinition = useAppStore((s) => s.addStatusDefinition)
  const updateStatusDefinition = useAppStore((s) => s.updateStatusDefinition)
  const deleteStatusDefinition = useAppStore((s) => s.deleteStatusDefinition)
  const requests = useAppStore((s) => s.requests)
  const { t, language } = useTranslation()
  const [pipelineFilter, setPipelineFilter] = useState<'Domestic' | 'Profession' | 'Invoice'>('Domestic')
  const [editing, setEditing] = useState<StatusDefinition | 'new' | null>(null)

  const filtered = definitions
    .filter((d) => d.pipeline === pipelineFilter)
    // Same order the rest of the system walks them in: the exceptions, which
    // can happen at any point, after the stages that have a place.
    .sort((a, b) => Number(a.isException) - Number(b.isException) || a.order - b.order)
  const counts = {
    Domestic: definitions.filter((d) => d.pipeline === 'Domestic').length,
    Profession: definitions.filter((d) => d.pipeline === 'Profession').length,
    Invoice: definitions.filter((d) => d.pipeline === 'Invoice').length,
  }

  /** How many placements have this stage in their log, which a delete leaves behind. */
  function loggedCount(label: string): number {
    return requests.filter((r) => r.statusHistory.some((h) => h.status === label)).length
  }

  function handleDelete(definition: StatusDefinition) {
    const logged = loggedCount(definition.label)
    const warning =
      logged === 0
        ? t('stage_delete_confirm')
        : language === 'ar'
          ? `${t('stage_delete_confirm')}\n\n${logged} طلبًا سجّل هذه المرحلة بالفعل، وتبقى في سجلّه كما هي.`
          : `${t('stage_delete_confirm')}\n\n${logged} request(s) already logged it; those logs keep the stage exactly as it was.`
    if (window.confirm(warning)) deleteStatusDefinition(definition.id)
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-ink-3">
          {language === 'ar' ? 'ثلاثة مسارات منفصلة' : 'Three separate pipelines'} - {counts.Domestic} {language === 'ar' ? 'منزلي' : 'Domestic'} + {counts.Profession} {language === 'ar' ? 'مهني' : 'Profession'} + {counts.Invoice} {language === 'ar' ? 'فواتير' : 'Invoice'} = {counts.Domestic + counts.Profession + counts.Invoice} {language === 'ar' ? 'إجمالي' : 'total'}
        </p>
        <div className="flex flex-wrap items-center gap-1">
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
          <PrimaryButton onClick={() => setEditing('new')} className="ms-1 flex items-center gap-1.5">
            <Plus className="size-3.5" /> {t('stage_add')}
          </PrimaryButton>
        </div>
      </div>
      <p className="mb-3 text-[10.5px] leading-relaxed text-ink-3">{t('stage_hint')}</p>
      <div className="overflow-x-auto">
        <table className="data-table">
        <thead>
          <tr>
            <th className="py-2 pe-3">#</th>
            <th className="py-2 pe-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
            <th className="py-2 pe-3">{language === 'ar' ? 'التكلفة الافتراضية' : 'Default Cost'}</th>
            <th className="py-2">{language === 'ar' ? 'ملاحظة' : 'Note'}</th>
            <th className="py-2 text-end">{t('label_action')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id} className="text-xs">
              <td className="py-2 pe-3 text-ink-3">{d.order || '-'}</td>
              <td className="py-2 pe-3 text-ink">
                {d.label}
                {d.isException && <span className="ms-1.5 rounded-control bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent-text">exception</span>}
                {d.isTerminal && !d.isException && <span className="ms-1.5 rounded-control bg-pos/20 px-1.5 py-0.5 text-[9px] text-pos">terminal</span>}
              </td>
              <td className="py-2 pe-3 text-ink-2">{d.defaultCost > 0 ? `$${d.defaultCost.toFixed(2)}` : '-'}</td>
              <td className="py-2 text-ink-3">{d.costNote}</td>
              <td className="py-2 text-end">
                <span className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    aria-label={t('action_edit')}
                    onClick={() => setEditing(d)}
                    className="text-ink-3 hover:text-accent-text"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={t('action_delete')}
                    onClick={() => handleDelete(d)}
                    className="text-ink-3 hover:text-neg"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-[11px] text-ink-3">
                {t('stage_none')}
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>

      {editing && (
        <StageModal
          definition={editing === 'new' ? null : editing}
          pipeline={pipelineFilter}
          nextOrder={Math.max(0, ...filtered.map((d) => d.order)) + 1}
          onClose={() => setEditing(null)}
          onSubmit={(data) => {
            if (editing === 'new') addStatusDefinition(data)
            else updateStatusDefinition(editing.id, data)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * One stage, with the details the rest of the system reads: where it sits in
 * the order, what it costs by default, the note shown when it is logged, and
 * whether reaching it ends the placement or interrupts it.
 */
function StageModal({
  definition,
  pipeline,
  nextOrder,
  onClose,
  onSubmit,
}: {
  definition: StatusDefinition | null
  pipeline: 'Domestic' | 'Profession' | 'Invoice'
  nextOrder: number
  onClose: () => void
  onSubmit: (data: Omit<StatusDefinition, 'id'>) => void
}) {
  const { t, language } = useTranslation()
  const [label, setLabel] = useState(definition?.label ?? '')
  const [where, setWhere] = useState(definition?.pipeline ?? pipeline)
  const [order, setOrder] = useState(String(definition?.order ?? nextOrder))
  const [defaultCost, setDefaultCost] = useState(String(definition?.defaultCost ?? 0))
  const [costNote, setCostNote] = useState(definition?.costNote ?? '')
  const [isTerminal, setIsTerminal] = useState(definition?.isTerminal ?? false)
  const [isException, setIsException] = useState(definition?.isException ?? false)
  const [problem, setProblem] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) {
      setProblem(language === 'ar' ? 'اسم المرحلة مطلوب.' : 'The stage needs a name.')
      return
    }
    onSubmit({
      label: label.trim(),
      pipeline: where,
      // An exception can happen at any point, so it carries no place in the walk.
      order: isException ? 0 : Number(order) || 0,
      defaultCost: Number(defaultCost) || 0,
      costNote: costNote.trim(),
      isTerminal,
      isException,
    })
  }

  return (
    <Modal title={definition ? t('stage_edit') : t('stage_add')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={language === 'ar' ? 'اسم المرحلة' : 'Stage name'}>
          <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Medical" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={language === 'ar' ? 'المسار' : 'Pipeline'}>
            <SelectInput value={where} onChange={(e) => setWhere(e.target.value as typeof where)}>
              <option value="Domestic">{language === 'ar' ? 'منزلي' : 'Domestic'}</option>
              <option value="Profession">{language === 'ar' ? 'مهني' : 'Profession'}</option>
              <option value="Invoice">{language === 'ar' ? 'فواتير' : 'Invoice'}</option>
            </SelectInput>
          </Field>
          <Field label={language === 'ar' ? 'الترتيب' : 'Order'}>
            <TextInput
              type="number"
              min={0}
              value={isException ? '0' : order}
              disabled={isException}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
        </div>
        <Field label={`${language === 'ar' ? 'التكلفة الافتراضية' : 'Default cost'} (USD)`}>
          <TextInput type="number" min={0} step="0.01" value={defaultCost} onChange={(e) => setDefaultCost(e.target.value)} />
        </Field>
        <Field label={language === 'ar' ? 'ملاحظة التكلفة' : 'Cost note'}>
          <TextInput value={costNote} onChange={(e) => setCostNote(e.target.value)} />
          <p className="mt-1 text-[10px] text-ink-3">{t('stage_note_hint')}</p>
        </Field>
        <label className="mb-2 flex items-center gap-2 text-[11px] text-ink-2">
          <input type="checkbox" checked={isTerminal} onChange={(e) => setIsTerminal(e.target.checked)} />
          {t('stage_terminal')}
        </label>
        <label className="mb-2 flex items-center gap-2 text-[11px] text-ink-2">
          <input
            type="checkbox"
            checked={isException}
            onChange={(e) => {
              setIsException(e.target.checked)
              if (e.target.checked) setIsTerminal(true)
            }}
          />
          {t('stage_exception')}
        </label>
        {problem && <p className="mt-1 text-[11px] font-medium text-neg">{problem}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('action_save')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
