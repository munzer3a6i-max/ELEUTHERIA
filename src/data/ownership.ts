/*
  Who works out what the stage log owes.

  In the browser alone, the app derives commissions, agency charges and
  backouts itself. Connected to a database, the database does it by trigger --
  because data entry may log a stage but may not read finance, and a browser
  that cannot see a commission cannot maintain one.

  This flag is the seam. It lives on its own so the store can read it without
  importing the sync layer, which imports the store.
*/

let server = false

export function setServerOwnsBilling(value: boolean): void {
  server = value
}

export function serverOwnsBilling(): boolean {
  return server
}
