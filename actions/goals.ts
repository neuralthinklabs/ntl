'use server'

import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { goals, contributions } from '@/db/schema'
import { awardPoints } from '@/lib/points'
import type { ActionState } from './auth'

const contributionSchema = z.object({
  goalId: z.string().uuid(),
  // Still accepted from the hidden form field for the idempotent-replay
  // fast path below, but never trusted for anything that touches the DB —
  // see the note near `goal.slug` further down (P1 #10).
  goalSlug: z.string(),
  amount: z.coerce.number().positive('Enter an amount greater than 0.'),
  kind: z.enum(['donation', 'time', 'in_kind']).default('donation'),
  note: z.string().max(300).optional(),
  clientRequestId: z.string().uuid('Please reload the page and try again.'),
})

export async function recordContribution(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please log in to contribute to this goal.' }
  }

  const parsed = contributionSchema.safeParse({
    goalId: formData.get('goalId'),
    goalSlug: formData.get('goalSlug'),
    amount: formData.get('amount'),
    kind: formData.get('kind') || 'donation',
    note: formData.get('note') || undefined,
    clientRequestId: formData.get('clientRequestId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { goalId, amount, kind, note, clientRequestId } = parsed.data

  // P1 #10: `goalId` is validated as a real, existing goal here (was
  // already the case) — the fix is that we now also stop trusting the
  // posted `goalSlug` for anything beyond the idempotent-replay success
  // message below. Every DB write and every `revalidatePath` call uses
  // `goal.slug` fetched from this row, not the client-supplied string, so
  // a tampered/stale hidden field can't point a write at one goal while
  // revalidating (or reporting success for) a different page.
  const goal = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (!goal) {
    return { error: 'This goal no longer exists. Please refresh the page.' }
  }

  const existing = await db.query.contributions.findFirst({
    where: eq(contributions.clientRequestId, clientRequestId),
  })
  if (existing) {
    return { success: 'Thank you for your contribution!' }
  }

  const amountCents = kind === 'donation' ? Math.round(amount * 100) : null

  const [inserted] = await db
    .insert(contributions)
    .values({
      userId: user.id,
      goalId: goal.id,
      clientRequestId,
      amountCents: amountCents ?? undefined,
      kind,
      note,
    })
    .onConflictDoNothing({ target: contributions.clientRequestId })
    .returning()

  if (!inserted) {
    return { success: 'Thank you for your contribution!' }
  }

  if (amountCents) {
    await db
      .update(goals)
      .set({ fundingRaisedCents: sql`${goals.fundingRaisedCents} + ${amountCents}` })
      .where(eq(goals.id, goal.id))
  }

  // P1 #9: centralized — see lib/points.ts.
  await awardPoints({
    userId: user.id,
    points: 15,
    type: 'goal_supported',
    title: `Supported a goal`,
    meta:
      kind === 'donation'
        ? `Contributed $${amount.toFixed(2)} · +15 pts`
        : `Pledged ${kind.replace('_', ' ')} · +15 pts`,
    relatedId: goal.id,
  })

  revalidatePath(`/goals/${goal.slug}`)
  revalidatePath('/support')
  revalidatePath('/dashboard')

  return { success: 'Thank you for your contribution!' }
}
