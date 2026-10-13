import { unstable_rethrow } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { requireAdminAction } from '@/lib/auth/admin'
import { isUniqueViolation } from '@/lib/db-errors'
import type { ActionState } from '@/actions/auth'

/**
 * Wraps an admin server action: checks the caller is an admin, runs the body,
 * and turns thrown errors into a friendly ActionState. Redirects (which Next
 * implements by throwing) are re-thrown untouched.
 */
export async function runAdmin(fn: (user: User) => Promise<ActionState>): Promise<ActionState> {
  try {
    const { user } = await requireAdminAction()
    return await fn(user)
  } catch (e) {
    unstable_rethrow(e)
    if (e instanceof Error && (e.message === 'Not authorized' || e.message === 'Not authenticated')) {
      return { error: 'You do not have permission to do that.' }
    }
    if (isUniqueViolation(e)) {
      return { error: 'That URL slug is already in use. Choose a different one.' }
    }
    console.error('[admin] action failed:', e)
    return { error: 'Something went wrong. Please try again.' }
  }
}
