import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use this in Server Components, Server Actions, and Route Handlers.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // `setAll` is called from a Server Component during a page
            // render, where cookies can't be mutated. Safe to ignore as
            // long as `middleware.ts` is refreshing the session.
          }
        },
      },
    },
  )
}

// Service-role client: bypasses Row Level Security. Only use this in
// trusted server-side code (e.g. admin actions, webhooks) — never expose
// the service role key to the client.
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
