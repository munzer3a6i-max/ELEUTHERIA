// Where the workers come from.
//
// Both values below are public by design. The URL is your Supabase project's
// address and the anon key is the key browsers are meant to carry: it can read
// the published_workers view and the published-photos bucket, and nothing else.
// Everything private is behind row level security and needs a signed-in member
// of staff. Never put the service_role key in this file or anywhere else on the
// website.
//
// You can either paste the two values here, or leave the fallbacks empty and
// set them as environment variables on the site's Vercel project:
//
//   Vite   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//          and read them with import.meta.env.VITE_SUPABASE_URL
//   Next   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
//          and read them with process.env.NEXT_PUBLIC_SUPABASE_URL
//
// Use whichever line matches the site and delete the other one. Mixing them
// breaks the build: Vite does not know process, Next does not fill
// import.meta.env.

export const SUPABASE_URL = 'https://ksfsapomxgxbdrwgesde.supabase.co'

export const SUPABASE_ANON_KEY = 'paste-the-anon-key-here'

// Vite version:
//   export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
//   export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
//
// Next version:
//   export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
//   export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
