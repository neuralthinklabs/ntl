'use server'

import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { goals, contributions, activityRecords, profiles } from '@/db/schema'
import type { ActionState } from './auth'

const contributionSchema = z.object({
  goalId: z.string().uuid(),
  goalSlug: z.string(),
  amount: z.coerce.number().positive('Enter an amount greater than 0.'),
  kind: z.enum(['donation', 'time', 'in_kind']).default('donation'),
  note: z.string().max(300).optional(),
  // Client-generated once per form mount (P0 #5) — same idempotency
  // pattern as actions/problems.ts.
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

  const { goalId, goalSlug, amount, kind, note, clientRequestId } = parsed.data

  // The goalId/goalSlug pair comes from hidden form fields, so validate
  // the goal actually exists before touching balances — a stale page or
  // a tampered request shouldn't be able to write against a bogus id.
  const goal = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (!goal) {
    return { error: 'This goal no longer exists. Please refresh the page.' }
  }

  // Idempotent replay guard (P0 #5): if this exact submission already
  // went through, don't record (or fund) it a second time.
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
      goalId,
      clientRequestId,
      amountCents: amountCents ?? undefined,
      kind,
      note,
    })
    .onConflictDoNothing({ target: contributions.clientRequestId })
    .returning()

  // Lost a race to a concurrent identical request — the other request
  // already recorded (and funded) this contribution, so don't double it.
  if (!inserted) {
    return { success: 'Thank you for your contribution!' }
  }

  if (amountCents) {
    await db
      .update(goals)
      .set({ fundingRaisedCents: sql`${goals.fundingRaisedCents} + ${amountCents}` })
      .where(eq(goals.id, goalId))
  }

  await db.insert(activityRecords).values({
    userId: user.id,
    type: 'goal_supported',
    title: `Supported a goal`,
    meta:
      kind === 'donation'
        ? `Contributed $${amount.toFixed(2)} · +15 pts`
        : `Pledged ${kind.replace('_', ' ')} · +15 pts`,
    pointsDelta: 15,
    relatedId: goalId,
  })

  await db
    .update(profiles)
    .set({ points: sql`${profiles.points} + 15` })
    .where(eq(profiles.id, user.id))

  revalidatePath(`/goals/${goalSlug}`)
  revalidatePath('/support')
  revalidatePath('/dashboard')

  return { success: 'Thank you for your contribution!' }
}
