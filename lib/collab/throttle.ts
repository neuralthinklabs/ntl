import 'server-only'
import { checkRateLimit, recordAttempt } from '@/lib/rate-limit'
import type { ActionState } from '@/actions/auth'

/** At most `max` actions of one kind per key per 15 minutes. Returns an error state when over the limit. */
export async function throttle(key: string, max: number): Promise<ActionState> {
  if (!(await checkRateLimit(key, max)).allowed) return { error: 'You are doing that too quickly. Please try again in a few minutes.' }
  await recordAttempt(key)
  return null
}
