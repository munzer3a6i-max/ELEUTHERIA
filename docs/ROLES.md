# Who can do what

Three roles, set per member of staff on the Staff page.

| Role | Finance pages | Caseload | Staff, addons, settings |
| --- | --- | --- | --- |
| **Administrator** | read and change | read and change | read and change |
| **Accountant** | read and change | read only | not shown |
| **Data entry** | not shown | read and change | not shown |

"Finance pages" means Accounting and everything under it — the Financial
Center, payroll, agency accounts, office expenses, backouts and the accounting
reports — plus invoices and the reports page. The caseload is applicants,
employers, agencies, agents and recruitment requests, including the stage log
and what each stage cost.

An accountant sees the caseload because the money makes no sense without it,
but cannot change it. Data entry never sees the finance pages at all; on the
dashboard they get the caseload figures and the alerts about stalled files and
expiring passports, not the ones about money.

A few things everyone can do regardless of role: read their notifications,
switch language and theme.

## Two layers, on purpose

`src/lib/permissions.ts` holds the rules. Every screen and every action in the
store belongs to one of four areas — finance, operations, system, personal —
and each role has a list of areas it may read and a list it may change.

The rules are enforced twice:

- **The screens hide what you cannot do.** Buttons that would be refused are
  not drawn, and pages you cannot open say so rather than redirecting you
  somewhere confusing.
- **The store refuses it anyway.** Every action checks the signed-in role
  before it runs, so a write that got past the interface — a stale tab, a
  tampered page, a future bug — changes nothing and says why in the console.

An action that is not listed in that table is treated as an administrator
action, so a new feature is locked down until someone decides where it belongs
rather than being open by default.

## Signing in

The login screen lists the active staff and signs you in as one of them. This
is still a stand-in for real authentication — there is no password, and anyone
who can open the app can pick any account. What it decides is real: the role
that account carries is the role the app enforces from then on, and the profile
menu shows who you are working as.

Real sign-in belongs with the move to a database, where accounts, passwords and
sessions live on a server rather than in a browser. Until then, treat this as a
way of keeping honest people in their lane, not as a security boundary.
