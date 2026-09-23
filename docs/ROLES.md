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
first, because it closes the Settings page behind you. Adding and removing an
account both ask too, and the question names the person it is about.

### What "add a user" does once there is a database

Connected, a staff row says what somebody may do and is not what lets them in;
the password lives in Supabase Auth. So adding a user does two things: it
creates the auth account, and it writes the staff row pointing at it through
`user_id`. Without the first, the person is refused at the door with nothing
to explain it, which is exactly what happened before this was wired up.

Two consequences worth knowing:

- **The email address is required**, because it is what they sign in with. The
  username is still theirs, and is what the app calls them; it is not what
  Supabase checks.
- **If the project asks people to confirm their address** (Supabase,
  Authentication, Providers, Email, "Confirm email"), the account is made but
  cannot sign in until they open the link they are sent. The dashboard says so
  when it happens. For an office where the administrator sets passwords
  anyway, turning that setting off is reasonable.
- **Where that link lands** is a Supabase setting, not ours. The dashboard asks
  for it to come back to whatever address it is being used from, but Supabase
  checks that against Authentication, URL Configuration, and falls back to the
  Site URL — `http://localhost:3000` until somebody changes it. Set the Site URL
  to the deployed dashboard and add it to Redirect URLs, or the link in a new
  colleague's inbox points at their own machine.

### When somebody is told no staff record points at their account

That message means the account exists and the staff row does not point at it —
`user_id` is empty. It happens to anyone added before the dashboard learned to
make the account itself, to anyone whose account was made by hand in Supabase,
and to anyone whose second attempt at being added was refused after the account
had already been created.

Settings → Users shows **No sign-in account** beside such a row and offers
**Link sign-in accounts**, which points every unlinked row at the account with
the same email address. The matching happens in the database, through
`ops.link_staff_accounts()` in `0008_link_accounts.sql`, because reading
`auth.users` needs rights no browser has; the function refuses anyone who is
not an administrator, skips a row with no address rather than guessing, and
never hands an account that already belongs to somebody to a second row.

If somebody stays unlinked, their staff row's email does not match any account.
Correct the address on the row, or create the account in Supabase under
Authentication → Users, and link again.

Removing a user deletes the staff row, which takes away everything the account
could reach -- signing in with it then gets as far as "no staff record points
at this account". The auth account itself stays in Supabase, because deleting
one needs the `service_role` key and that key has no business in a browser.
Delete it from the Supabase dashboard if you want it gone entirely.

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
