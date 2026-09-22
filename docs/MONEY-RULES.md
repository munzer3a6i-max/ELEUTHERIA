# How the money rules work

Three things now create money on their own, from the stage log rather than from
anyone typing a number twice: an agent's fee, a partner office's contract
payments, and the bills for bringing a worker home. This is what each one does
and where the policy lives.

## The single source of truth

`src/data/businessRules.ts` holds the policy constants — the guarantee window,
the stage that counts as "visa issued", the cash assistance figure. Change a
rule there and the whole app follows.

`src/lib/derivedBilling.ts` turns a request's status history into commissions,
agency charges and backout records. It runs after every change that could move
a milestone (a logged stage, an edited stage, a changed agent or contract), and
it is idempotent: rows are keyed by request and milestone, so re-running it
never duplicates anything.

Two rules it never breaks:

- **A settled row is a fact.** Once a commission is paid or a charge received,
  the sync leaves its amount and date alone, and will not delete it even if the
  stage behind it is removed.
- **Unsettled rows follow the current data.** Change a contract price and the
  halves that have not been paid yet move with it.

## The agent

An agent introduces some of the candidates, not all of them. They earn
**half their fee when their candidate is Selected** and **the other half when
she is Deployed** — $500 and $500 by default, editable per agent.

The fee is counted once. The pipeline's `Selected` and `Deployed` stages
default to a $500 cost with the note "or $150 cash assistance if not placed
through an agent". So:

| Candidate came from | Stage cost | Commission record |
| --- | --- | --- |
| An agent | 0 | $500 to that agent |
| Directly | $150 cash assistance | none |

The status-update form applies this automatically and says which case it is,
so the stage log and the Agents page can never bill the same fee twice.

Commissions are an **expense**, booked on the day the milestone was reached
whether or not the money has left yet — the same accrual rule the stage costs
already follow.

## The partner office

A domestic worker is only placed through an office holding a **contract**,
which fixes what that office pays per worker. Against that price:

- **Half falls due when she is Selected.**
- **The other half when her visa is issued** (the `Visa Stamping` stage).

Both halves are generated from the stage log and shown on the Agencies page,
where they are marked received as the money lands.

Agency charges are **income**, counted when they are actually settled, the same
cash rule the invoice payments follow. An unsettled half is money owed to us
and shows up as outstanding on the agency's account.

> **Check this one.** It reads the partner offices as paying *us*: Eleutheria
> holds a DMW licence and a Manila address, which makes it the sending agency,
> and the Financial Center lists Gulf offices with a balance outstanding. If
> the money actually flows the other way, the direction is set in one place —
> the `kind: 'income'` on the agency-charge rows in `src/lib/financials.ts` —
> and the Agencies page labels beside it.

## The backout

A worker who leaves the placement and returns home is a backout. It is opened
automatically when a request that reached `Deployed` is logged as `Back Out`,
so it cannot be missed.

Who pays depends on how long she stayed:

- **Under three months** — inside the guarantee, so the company brings her home
  at its own expense and the bills are ours.
- **Three months or more** — the employer carries the return.

The liability is derived from the two dates and can be overridden (to the
agency, for instance) when the facts say otherwise. Each backout keeps its own
list of bills — ticket, accommodation, exit clearance — and only the ones the
company carries reach the ledger, as an expense on the date of each bill.

## Where it all lands

The Accounting Reports income statement now separates the direct cost of a
placement into three lines: recruitment costs, agent commissions, and backout
costs. Everything else stays where it was.
