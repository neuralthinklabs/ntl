import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'

/**
 * NOTE on middleware: `lib/supabase/middleware.ts` (`updateSession`) runs
 * in the Edge middleware runtime, which can't use the `postgres` /
 * Drizzle client these helpers depend on (it needs Node APIs). Its admin
 * check there is intentionally a lightweight, separate Supabase query —
 * treat this file as the canonical check for pages and Server Actions,
 * and keep middleware's check in sync with it if the authorization rule
 * ever changes (currently: `profiles.role === 'admin'`).
 *
 * Single source of truth for "is this user an admin". Every place that
 * needs to gate on admin status (middleware, page loaders, server
 * actions) should go through one of the two helpers below instead of
 * re-implementing the `profiles.role === 'admin'` check inline.
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
