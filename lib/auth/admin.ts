import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { isTeamRole } from '@/lib/roles'

/**
 * NOTE on middleware: `lib/supabase/middleware.ts` (`updateSession`) runs
 * in the Edge middleware runtime, which can't use the `postgres` /
 * Drizzle client these helpers depend on (it needs Node APIs). Its admin
 * check calls `fetchIsAdminRole` from `lib/auth/role-check.ts` — the
 * same underlying `profiles.role === 'admin'` rule this file's `isAdmin()`
 * enforces via Drizzle. If that rule ever changes, update
 * `lib/auth/role-check.ts` and this file together.
 *
 * Treat this file as the canonical check for pages and Server Actions.
 *
 * Roles: member < volunteer < core_team < admin. Only `admin` can use /admin
 * and change roles. volunteer / core_team / admin can open /team, where they
 * see ONLY assignments whose assignee_id is their own id.
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

/** For Server Components: login redirect, then non-admins to the dashboard. */
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

/** For Server Actions (mutations): throws instead of redirecting. */
export async function requireAdminAction() {
  const { user, profile } = await getCurrentUserAndProfile()

  if (!user) throw new Error('Not authenticated')
  if (profile?.role !== 'admin') throw new Error('Not authorized')

  return { user, profile }
}

/** Pages for volunteers / core team / admins (the /team workspace). */
export async function requireTeamPage(nextPath: string) {
  const { user, profile } = await getCurrentUserAndProfile()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
  }
  if (!profile || !isTeamRole(profile.role)) {
    redirect('/dashboard')
  }

  return { user, profile }
}

/** Server Actions for the /team workspace. */
export async function requireTeamAction() {
  const { user, profile } = await getCurrentUserAndProfile()

  if (!user) throw new Error('Not authenticated')
  if (!profile || !isTeamRole(profile.role)) throw new Error('Not authorized')

  return { user, profile }
}
