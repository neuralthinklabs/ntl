import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'

/**
 * NOTE on middleware: `lib/supabase/middleware.ts` (`updateSession`) runs
 * in the Edge middleware runtime, which can't use the `postgres` /
 * Drizzle client these helpers depend on (it needs Node APIs). Its admin
 * check now calls `fetchIsAdminRole` from `lib/auth/role-check.ts` — the
 * same underlying `profiles.role === 'admin'` rule this file's `isAdmin()`
 * enforces via Drizzle. If that rule ever changes, update
 * `lib/auth/role-check.ts` and this file together (there is intentionally
 * no way to share the actual DB client across the two runtimes, only the
 * rule).
 *
 * Treat this file as the canonical check for pages and Server Actions.
 */

export async function getCurrentUserAndProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, profile: null }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })

  return { user, profile: profile ?? null }
}

export async function isAdmin() {
  const { profile } = await getCurrentUserAndProfile()
  return profile?.role === 'admin'
}

/**
 * For Server Components (pages): redirects unauthenticated users to
 * login and non-admins to the dashboard. Returns the user + profile for
 * callers that need them.
 */
export async function requireAdminPage(nextPath: string) {
  const { user, profile } = await getCurrentUserAndProfile()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
  }
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return { user, profile }
}

/**
 * For Server Actions (mutations): throws instead of redirecting, since
 * actions can't redirect a caller that isn't rendering a page. Callers
 * should let this throw propagate (it will surface as a generic error
 * to the client) rather than swallowing it.
 */
export async function requireAdminAction() {
  const { user, profile } = await getCurrentUserAndProfile()

  if (!user) throw new Error('Not authenticated')
  if (profile?.role !== 'admin') throw new Error('Not authorized')

  return { user, profile }
}
