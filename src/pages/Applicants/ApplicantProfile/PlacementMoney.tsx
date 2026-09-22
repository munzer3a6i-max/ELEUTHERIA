import { Link } from 'react-router-dom'
import { HandCoins } from 'lucide-react'
import { useAppStore, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { CASH_ASSISTANCE } from '../../../data/businessRules'
import { backoutTotal, contractForAgency } from '../../../lib/derivedBilling'
import Card from '../../../components/Card'
import StatusBadge from '../../../components/StatusBadge'
import type { RecruitmentRequest } from '../../../types'

/**
 * What this one placement is worth, beside the stage log that produces it: the
 * agent's two halves going out, the partner office's two halves coming in, and
 * the bill for bringing her home if she backed out.
 */
export default function PlacementMoney({ request }: { request: RecruitmentRequest }) {
  const applicants = useAppStore((s) => s.applicants)
  const agents = useAppStore((s) => s.agents)
  const commissions = useAppStore((s) => s.agentCommissions)
  const charges = useAppStore((s) => s.agencyCharges)
  const backouts = useAppStore((s) => s.backouts)
  const agencies = useAppStore((s) => s.agencies)
  const contracts = useAppStore((s) => s.agencyContracts)
  const currency = useAppStore((s) => s.settings.currency)
  const { t, tb, language } = useTranslation()

  const applicant = applicants.find((a) => a.id === request.applicantId) ?? null
  const agent = applicant?.agentId ? agents.find((a) => a.id === applicant.agentId) ?? null : null
  const agency = agencies.find((a) => a.id === request.recruitmentAgencyId) ?? null
  const mine = commissions.filter((c) => c.requestId === request.id)
  const due = charges.filter((c) => c.requestId === request.id)
  const backout = backouts.find((b) => b.requestId === request.id) ?? null
  // Nothing is due yet until a milestone lands, so say what the contract will
  // ask for rather than implying there is no agreement.
  const contract = request.recruitmentAgencyId
    ? contractForAgency(contracts, request.recruitmentAgencyId)
    : null

  return (
    <Card
      icon={<HandCoins className="size-3.5" />}
      title={language === 'ar' ? 'مالية هذا الاستقدام' : 'What this placement moves'}
      subtitle={agent ? `${t('agent_introduced_by')} ${tb(agent.name)}` : t('agent_none')}
      bodyClassName="p-0"
    >
      <section className="border-b border-line px-4 py-3">
        <h3 className="mb-2 text-[11px] font-semibold text-ink-3">{t('agent_commissions')}</h3>
        {agent ? (
          <ul className="flex flex-col gap-1.5">
            {mine.map((commission) => (
              <li key={commission.id} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="flex min-w-0 items-center gap-2">
                  <StatusBadge status={commission.milestone} />
                  <span className="num truncate text-ink-3">{commission.earnedOn}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span dir="ltr" className="num text-ink">
                    {formatMoney(commission.amount, currency, 0)}
                  </span>
                  <StatusBadge status={commission.status} />
                </span>
              </li>
            ))}
            {mine.length === 0 && (
              <li className="text-[11.5px] text-ink-3">{t('agent_fee_rule')}</li>
            )}
            <li className="pt-1">
              <Link to="/agents" className="text-[11px] text-accent-text hover:text-accent">
                {t('fin_view_details')}
              </Link>
            </li>
          </ul>
        ) : (
          <p className="text-[11.5px] leading-relaxed text-ink-3">
            {t('agent_direct_note')} ({formatMoney(CASH_ASSISTANCE, currency, 0)})
          </p>
        )}
      </section>

      <section className={backout ? 'border-b border-line px-4 py-3' : 'px-4 py-3'}>
        <h3 className="mb-2 text-[11px] font-semibold text-ink-3">
          {t('contract_charges')}
          {agency && <span className="ms-1.5 font-normal">· {tb({ en: agency.englishName, ar: agency.arabicName })}</span>}
        </h3>
        <ul className="flex flex-col gap-1.5">
          {due.map((charge) => (
            <li key={charge.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex min-w-0 items-center gap-2">
                <StatusBadge status={charge.milestone} tone={charge.milestone === 'Selected' ? 'info' : 'accent'} />
                <span className="num truncate text-ink-3">{charge.dueOn}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span dir="ltr" className="num text-ink">
                  {formatMoney(charge.amount, currency, 0)}
                </span>
                <StatusBadge status={charge.status} />
              </span>
            </li>
          ))}
          {due.length === 0 && (
            <li className="text-[11.5px] leading-relaxed text-ink-3">
              {contract
                ? `${t('contract_half_selected')} ${formatMoney(contract.pricePerWorker / 2, currency, 0)} · ${t('contract_half_visa')} ${formatMoney(contract.pricePerWorker / 2, currency, 0)}`
                : t('contract_none')}
            </li>
          )}
        </ul>
      </section>

      {backout && (
        <section className="px-4 py-3">
          <h3 className="mb-2 text-[11px] font-semibold text-ink-3">{t('backout_costs')}</h3>
          <p className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-ink-2">
              {backout.returnedOn} · {t('backout_liability')} {backout.liability === 'Company' ? t('backout_liability_company') : backout.liability === 'Employer' ? t('backout_liability_employer') : t('backout_liability_agency')}
            </span>
            <span dir="ltr" className="num shrink-0 text-neg">
              {formatMoney(backoutTotal(backout), currency, 0)}
            </span>
          </p>
          <Link to="/accounting/backouts" className="mt-2 inline-block text-[11px] text-accent-text hover:text-accent">
            {t('fin_view_details')}
          </Link>
        </section>
      )}
    </Card>
  )
}
