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

## Accounts

Administrators manage accounts in **Settings → Users**: add someone with a
username, a starting password and a role; change any of those later; reset a
forgotten password; suspend an account so it cannot sign in; or remove it
entirely. Everyone else reaches **My Account** from the profile menu, where
they can change their own password and see what their role allows.

The Staff page is the roster — who works here and how much of the caseload
each person carries. It deliberately does not edit accounts: one record, one
place to change it.

New and reset accounts start with the password `12345`, marked **Starting
password** in the users table until the person changes it themselves. Anyone
still on a starting password is visible at a glance, which is the point.

Three things the app refuses, because a browser-only app has no way to undo
them:

- Suspending or removing the account you are signed in as.
- Removing, suspending or demoting the last active administrator.
- A second account with a username somebody already has.

Demoting *yourself* while another administrator exists is allowed, and asks
first, because it closes the Settings page behind you.

## What the password is, and is not

Passwords are not stored. Each account keeps a random salt and the SHA-256 of
that salt and the password together; signing in re-runs the sum and compares.
So an account record never hands over a password somebody probably reused
somewhere else.

That is the honest limit of it. Everything lives in the browser's
localStorage, and anyone who can open the developer tools can edit it — change
their own role, or sign themselves in. **This is a lock on the office door,
not a security boundary.** It keeps the wrong person out of the wrong screen;
it does not defend against someone determined to get past it.

Real authentication — accounts, sessions and slow, memory-hard password
hashing, all on a server — arrives with the database. Until then, treat the
roles as a way of keeping honest people in their lane, and do not put anything
in this app that would be dangerous in the hands of whoever can open the
laptop.

One practical note: the hashing uses the browser's WebCrypto, which only
exists on `https://` pages and on `localhost`. Serve the built app over HTTPS
or nobody will be able to sign in.
