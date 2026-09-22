// Applies the migrations to an in-process Postgres and checks that the
// public projection cannot leak anything it should not.
//
//   npm i -D @electric-sql/pglite --no-save && node scripts/test-schema.mjs

import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const db = new PGlite()
await db.waitReady
const ver = (await db.query('select version()')).rows[0].version.split(',')[0]
console.log('running against', ver, '\n')

const run = async (sql, label) => {
  try {
    await db.exec(sql)
    return true
  } catch (e) {
    console.log(`FAILED ${label}\n   ${String(e.message).split('\n').slice(0, 3).join('\n   ')}`)
    return false
  }
}

await run(`
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable as $$ select current_setting('test.uid', true)::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  end $$;
`, 'supabase stubs')

for (const file of ['db/migrations/0001_init.sql', 'db/migrations/0002_security.sql']) {
  const ok = await run(readFileSync(file, 'utf8'), file)
  console.log(ok ? `applied  ${file}` : `stopped at ${file}`)
  if (!ok) { await db.close(); process.exit(1) }
}
console.log()

const one = async (sql) => (await db.query(sql)).rows[0]
console.log('tables      ', (await one(`select count(*)::int n from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`)).n)
console.log('policies    ', (await one(`select count(*)::int n from pg_policies where schemaname='public'`)).n)
console.log('rls enabled ', (await one(`select count(*)::int n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relkind='r' and c.relrowsecurity`)).n)
console.log()

const cols = (await db.query(`select column_name from information_schema.columns where table_name='published_workers' order by ordinal_position`)).rows.map((r) => r.column_name)
console.log('published_workers exposes:', cols.join(', '))
const leaked = ['passport_no','id_number','phone','telephone','dob','passport_end','cv_path','passport_copy_path'].filter((c) => cols.includes(c))
console.log(leaked.length === 0 ? 'PASS  no sensitive column reaches the public view' : `FAIL  leaked: ${leaked}`)

await run(`
  insert into applicants (english_name, gender, dob, country, profession, experience_years, passport_no, published_to_website, status)
  values ('Maricel S. Dela Cruz','Female','1996-03-14','Philippines','Housemaid',3,'P1234567A',true ,'Available'),
         ('Hidden Person'       ,'Female','1990-01-01','Philippines','Housemaid',5,'P9999999Z',false,'Available'),
         ('Already Placed'      ,'Male'  ,'1988-06-02','Philippines','Driver'   ,9,'P5555555Q',true ,'Deployed');
`, 'seed')
const rows = (await db.query('select english_name, age, profession from published_workers order by english_name')).rows
console.log('view returns:', JSON.stringify(rows))
console.log(rows.length === 1 && rows[0].english_name === 'Maricel S. Dela Cruz'
  ? 'PASS  only published and available workers are visible, date of birth reduced to age'
  : 'FAIL  wrong rows exposed')

await db.exec('grant usage on schema public to anon')
try {
  await db.exec("set role anon; select passport_no from applicants limit 1;")
  console.log('FAIL  anon could read the applicants table')
} catch (e) {
  console.log('PASS  anon blocked from applicants:', String(e.message).split('\n')[0])
}
await db.exec('reset role')
await db.close()
