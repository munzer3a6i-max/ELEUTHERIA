import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, HandCoins, Pencil, Plus, Trash2, Undo2, UserPlus, Users, Wallet } from 'lucide-react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import StatStrip from '../../components/StatStrip'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import {
  BilingualField,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PrimaryButton,
  SecondaryButton,
} from '../../components/form'
import type { Agent, AgentCommission } from '../../types'

/** What one agent has earned, been paid, and is still owed. */
function totals(commissions: AgentCommission[]) {
  const earned = commissions.reduce((sum, c) => sum + c.amount, 0)
  const paid = commissions.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0)
  return { earned, paid, owed: earned - paid }
}

export default function AgentsList() {
  const agents = useAppStore((s) => s.agents)
  const applicants = useAppStore((s) => s.applicants)
  const commissions = useAppStore((s) => s.agentCommissions)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const currency = useAppStore((s) => s.settings.currency)
  const deleteAgent = useAppStore((s) => s.deleteAgent)
  const setCommissionStatus = useAppStore((s) => s.setCommissionStatus)
  const { t, tb, language } = useTranslation()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Agent | 'new' | null>(null)

  const rows = useMemo(
    () =>
      agents.map((agent) => ({
        agent,
        candidates: applicants.filter((a) => a.agentId === agent.id).length,
        ...totals(commissions.filter((c) => c.agentId === agent.id)),
      })),
    [agents, applicants, commissions],
  )

  const selected = rows.find((r) => r.agent.id === selectedId) ?? rows[0] ?? null
  const selectedCommissions = selected
    ? commissions.filter((c) => c.agentId === selected.agent.id)
    : []
  const direct = applicants.filter((a) => a.agentId === null).length
  const book = totals(commissions)

  function handleDelete(agent: Agent) {
    if (window.confirm(`${t('agent_delete_confirm')}\n\n${tb(agent.name)}`)) deleteAgent(agent.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('agent_title')}
        subtitle={t('agent_subtitle')}
        actions={
          <PrimaryButton onClick={() => setEditing('new')}>
            <Plus className="size-3.5" /> {t('agent_add')}
          </PrimaryButton>
        }
      />

      <StatStrip
        stats={[
          {
            label: t('agent_title'),
            value: String(agents.length),
            note: `${agents.filter((a) => a.status === 'Active').length} ${t('label_active').toLowerCase()}`,
            icon: <UserPlus className="size-4" />,
          },
          {
            label: t('agent_candidates'),
            value: String(applicants.filter((a) => a.agentId !== null).length),
            note: `${direct} ${t('agent_none').toLowerCase()}`,
            icon: <Users className="size-4" />,
          },
          {
            label: t('agent_earned'),
            value: formatMoney(book.earned, currency, 0),
            note: t('agent_fee_rule'),
            icon: <HandCoins className="size-4" />,
          },
          {
            label: t('agent_owed'),
            value: formatMoney(book.owed, currency, 0),
            tone: book.owed > 0 ? 'warn' : undefined,
            note: `${commissions.filter((c) => c.status === 'Pending').length} ${t('acc_pending').toLowerCase()}`,
            icon: <Wallet className="size-4" />,
          },
        ]}
      />

      <Card title={t('agent_title')} subtitle={t('agent_subtitle')} bodyClassName="overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('label_name')}</th>
              <th>{t('agent_area')}</th>
              <th>{t('label_phone')}</th>
              <th className="text-end">{t('agent_candidates')}</th>
              <th className="text-end">{t('agent_earned')}</th>
              <th className="text-end">{t('agent_owed')}</th>
              <th>{t('label_status')}</th>
              <th className="text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.agent.id}
                onClick={() => setSelectedId(row.agent.id)}
                className={`cursor-pointer ${row.agent.id === selected?.agent.id ? 'bg-accent-soft/40' : ''}`}
              >
                <td>
                  <span className="block font-medium text-ink">{tb(row.agent.name)}</span>
                  <span dir="ltr" className="block text-[10.5px] text-ink-3 rtl:text-end">{row.agent.email}</span>
                </td>
                <td>{row.agent.area}</td>
                <td dir="ltr" className="num whitespace-nowrap text-[11.5px] rtl:text-end">{row.agent.phone}</td>
                <td className="num text-end text-ink">{row.candidates}</td>
                <td dir="ltr" className="num whitespace-nowrap text-end">
                  {formatMoney(row.earned, currency, 0)}
                </td>
                <td dir="ltr" className={`num whitespace-nowrap text-end ${row.owed > 0 ? 'text-warn' : 'text-ink-3'}`}>
                  {formatMoney(row.owed, currency, 0)}
                </td>
                <td>
                  <StatusBadge status={row.agent.status} />
                </td>
                <td className="text-end">
                  <span className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      aria-label={t('action_edit')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(row.agent)
                      }}
                      className="text-ink-3 hover:text-accent-text"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('action_delete')}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(row.agent)
                      }}
                      className="ms-2 text-ink-3 hover:text-neg"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-3">
                  {t('acc_no_rows')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Card
              title={`${t('agent_commissions')} · ${tb(selected.agent.name)}`}
              subtitle={`${formatMoney(selected.paid, currency, 0)} ${t('agent_paid_out').toLowerCase()} · ${formatMoney(selected.owed, currency, 0)} ${t('agent_owed').toLowerCase()}`}
              bodyClassName="overflow-x-auto p-0"
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('agent_candidate')}</th>
                    <th>{t('agent_milestone')}</th>
                    <th>{t('label_date')}</th>
                    <th className="text-end">{t('label_amount')}</th>
                    <th>{t('label_status')}</th>
                    <th className="text-end">{t('label_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCommissions.map((commission) => {
                    const applicant = applicants.find((a) => a.id === commission.applicantId)
                    const source = paymentSources.find((p) => p.id === commission.paymentSourceId)
                    return (
                      <tr key={commission.id}>
                        <td>
                          {applicant ? (
                            <Link to={`/applicants/${applicant.id}`} className="font-medium text-ink hover:text-accent-text">
                              {language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <StatusBadge status={commission.milestone} />
                        </td>
                        <td className="num whitespace-nowrap">{commission.earnedOn}</td>
                        <td dir="ltr" className="num whitespace-nowrap text-end text-ink">
                          {formatMoney(commission.amount, currency)}
                        </td>
                        <td>
                          <StatusBadge status={commission.status} />
                          {source && <span className="ms-2 text-[10.5px] text-ink-3">{source.name}</span>}
                        </td>
                        <td className="text-end">
                          {commission.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCommissionStatus(
                                  commission.id,
                                  'Paid',
                                  paymentSources.find((p) => p.scopes.includes('Request Status'))?.id ?? null,
                                )
                              }
                              className="btn btn-secondary h-7"
                            >
                              <Check className="size-3.5" /> {t('agent_mark_paid')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCommissionStatus(commission.id, 'Pending')}
                              className="btn btn-ghost h-7"
                            >
                              <Undo2 className="size-3.5" /> {t('agent_mark_pending')}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {selectedCommissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-3">
                        {t('acc_no_rows')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="grid content-start gap-4 lg:col-span-5">
            <Card title={t('agent_candidates')} subtitle={selected.agent.area} bodyClassName="p-0">
              <ul className="divide-y divide-line">
                {applicants
                  .filter((a) => a.agentId === selected.agent.id)
                  .map((applicant) => (
                    <li key={applicant.id}>
                      <Link
                        to={`/applicants/${applicant.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-raised"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-medium text-ink">
                            {language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName}
                          </span>
                          <span className="block truncate text-[11px] text-ink-3">{applicant.profession}</span>
                        </span>
                        <StatusBadge status={applicant.status} />
                      </Link>
                    </li>
                  ))}
                {selected.candidates === 0 && (
                  <li className="px-4 py-10 text-center text-[12px] text-ink-3">{t('acc_no_rows')}</li>
                )}
              </ul>
            </Card>

            <Card title={t('agent_fee_rule')}>
              <dl className="flex flex-col gap-2 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-2">{t('agent_selection_fee')}</dt>
                  <dd dir="ltr" className="num text-ink">{formatMoney(selected.agent.selectionFee, currency, 0)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-2">{t('agent_deployment_fee')}</dt>
                  <dd dir="ltr" className="num text-ink">{formatMoney(selected.agent.deploymentFee, currency, 0)}</dd>
                </div>
              </dl>
              {selected.agent.notes && (
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">{selected.agent.notes}</p>
              )}
              <p className="mt-3 rounded-control border border-line bg-sunken p-2.5 text-[10.5px] leading-relaxed text-ink-3">
                {t('agent_direct_note')}
              </p>
            </Card>
          </div>
        </div>
      )}

      {editing && <AgentModal agent={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function AgentModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const addAgent = useAppStore((s) => s.addAgent)
  const updateAgent = useAppStore((s) => s.updateAgent)
  const { t, language } = useTranslation()

  const [nameEn, setNameEn] = useState(agent?.name.en ?? '')
  const [nameAr, setNameAr] = useState(agent?.name.ar ?? '')
  const [phone, setPhone] = useState(agent?.phone ?? '')
  const [email, setEmail] = useState(agent?.email ?? '')
  const [area, setArea] = useState(agent?.area ?? '')
  const [selectionFee, setSelectionFee] = useState(String(agent?.selectionFee ?? 500))
  const [deploymentFee, setDeploymentFee] = useState(String(agent?.deploymentFee ?? 500))
  const [status, setStatus] = useState<Agent['status']>(agent?.status ?? 'Active')
  const [notes, setNotes] = useState(agent?.notes ?? '')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!nameEn.trim()) return
    const data = {
      name: { en: nameEn.trim(), ar: nameAr.trim() },
      phone: phone.trim(),
      email: email.trim(),
      area: area.trim(),
      selectionFee: Number(selectionFee) || 0,
      deploymentFee: Number(deploymentFee) || 0,
      notes: notes.trim(),
    }
    if (agent) updateAgent(agent.id, { ...data, status })
    else addAgent(data)
    onClose()
  }

  return (
    <Modal title={agent ? t('agent_edit') : t('agent_add')} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={t('label_english_name')}
          labelAr={t('label_arabic_name')}
          valueEn={nameEn}
          valueAr={nameAr}
          onChangeEn={setNameEn}
          onChangeAr={setNameAr}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9xx xxx xxxx" />
          </Field>
          <Field label={t('label_email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <Field label={t('agent_area')}>
          <TextInput value={area} onChange={(e) => setArea(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('agent_selection_fee')} hint={t('contract_half_selected')}>
            <TextInput
              type="number"
              min="0"
              step="10"
              value={selectionFee}
              onChange={(e) => setSelectionFee(e.target.value)}
            />
          </Field>
          <Field label={t('agent_deployment_fee')}>
            <TextInput
              type="number"
              min="0"
              step="10"
              value={deploymentFee}
              onChange={(e) => setDeploymentFee(e.target.value)}
            />
          </Field>
        </div>
        {agent && (
          <Field label={t('label_status')}>
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value as Agent['status'])}>
              <option value="Active">{t('label_active')}</option>
              <option value="Inactive">{t('label_inactive')}</option>
            </SelectInput>
          </Field>
        )}
        <Field label={language === 'ar' ? 'ملاحظات' : 'Notes'}>
          <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{agent ? t('action_save') : t('agent_add')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
