import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Single source of truth for the *query shape* behind "is this user an
 * admin". This file must stay edge-runtime safe (no `drizzle-orm` /
 * `postgres` imports) because `lib/supabase/middleware.ts` runs in the
 * Next.js Edge middleware runtime, which cannot load the Node-only
 * Postgres driver that `lib/auth/admin.ts` uses everywhere else in the app.
 *
 * Previously `lib/auth/admin.ts` (the documented "canonical" check for
 * pages/Server Actions) and `lib/supabase/middleware.ts` (the edge check)
 * each hard-coded their own `profiles.role === 'admin'` query. Two
 * independent implementations of the same rule is exactly how they'd
 * silently diverge later (e.g. someone adds a `banned` flag or a
 * `super_admin` role and only updates one). Both call sites now import
 * this one function instead.
 *
 * If the authorization rule ever changes, change it here — middleware and
 * every page/action pick it up automatically.
 */
export async function fetchIsAdminRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[role-check] failed to fetch role for admin check:', error)
    return false // fail closed — an error here must never grant admin access
  }

  return data?.role === 'admin'
}
