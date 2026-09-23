# ELEUTHERIA

The office dashboard for Eleutheria International Placement Services: the
workers, the requests they come in on, the agencies and agents behind them, and
the money each stage of a placement moves.

It is bilingual throughout — English and Arabic, laid out left to right or right
to left with the same components — and it is a static site talking straight to
Supabase, so there is no server of ours in the middle.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in the project URL and the anon key
npm run dev
```

Without `.env.local` the dashboard still runs, keeping everything in the
browser it is open in. That is useful for a look around and wrong for the
office; connect the project before real work goes in.

```bash
npm run build   # type-check and build into dist/
npm run lint
npm run preview # serve dist/ locally
```

## Where things are

| | |
| --- | --- |
| [`docs/DATABASE.md`](docs/DATABASE.md) | The Supabase project: the `ops` schema, how to run the migrations, what to do when something goes wrong. |
| [`docs/ROLES.md`](docs/ROLES.md) | Administrator, accountant and data entry — what each may reach, and why the database and not the browser decides. |
| [`docs/MONEY-RULES.md`](docs/MONEY-RULES.md) | Every rule that turns a stage of a placement into money: agency price, agent commission, backout. |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Putting the dashboard online. |
| [`db/`](db/) | The migrations, the bootstrap, and the SQL to paste when there is no terminal to hand. |
| [`website/`](website/README.md) | The workers page for the public site, which reads the workers the office publishes. |
| [`scripts/`](scripts/) | The test suites — the schema, the money rules, the row mapping, the save path, the import. |

## The tests

They run against a real Postgres in-process, not a mock, so the permission
rules and the money triggers are exercised as the server will run them.

```bash
node scripts/test-schema.mjs    # tables, row level security, the role matrix
node scripts/test-billing.mjs   # the derived money rules
node scripts/test-rows.mjs      # app shapes to columns and back
node scripts/test-sync.mjs      # what the save path sends
node scripts/test-import.mjs    # the three import routes agree
node scripts/test-accounts.mjs # what Supabase Auth's answers are read as
```

## A word about keys

The anon key ships inside the browser bundle and is meant to be public; what
keeps the data safe is row level security on every table. The `service_role`
key bypasses all of it and must never appear in this repository, this
application, or any build output.
