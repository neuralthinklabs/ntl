'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contributions, goals, profiles } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { awardPoints } from '@/lib/points'
import { sendEmail, pledgeConfirmedEmail } from '@/lib/email'
import { money } from '@/lib/format'
import type { ActionState } from '../auth'

class StateError extends Error {}

function refresh(goalSlug?: string | null) {
  revalidatePath('/admin/contributions')
  revalidatePath('/admin')
  revalidatePath('/support')
  revalidatePath('/')
  revalidatePath('/contributions/mine')
  if (goalSlug) revalidatePath(`/goals/${goalSlug}`)
}

/**
 * Admin has received the money: mark the pledge confirmed and ONLY NOW add it
 * to the campaign's public progress bar. Atomic with the points award.
 */
export async function confirmContribution(id: string, paymentRef: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const ref = z.string().trim().max(120).parse(paymentRef ?? '')
    try {
      const done = await db.transaction(async (tx) => {
        const [c] = await tx
          .update(contributions)
          .set({ status: 'confirmed', paymentRef: ref || null, confirmedAt: new Date(), confirmedBy: admin.id })
          .where(and(eq(contributions.id, id), eq(contributions.status, 'pledged')))
          .returning()
        if (!c) throw new StateError('This pledge is no longer waiting for confirmation.')

        let goal: { slug: string; title: string } | undefined
        if (c.goalId) {
          const [g] = await tx
            .update(goals)
            .set({
              fundingRaisedCents: sql`${goals.fundingRaisedCents} + ${c.amountCents ?? 0}`,
              updatedAt: new Date(),
            })
            .where(eq(goals.id, c.goalId))
            .returning({ slug: goals.slug, title: goals.title })
          goal = g
        }

        await awardPoints({
          executor: tx,
          userId: c.userId,
          points: 15,
          type: 'goal_supported',
          title: 'Supported a campaign',
          meta: `Contributed ${money(c.amountCents ?? 0)} · +15 pts`,
          relatedId: c.goalId ?? undefined,
        })
        return { c, goal }
      })

      const donor = await db.query.profiles.findFirst({ where: eq(profiles.id, done.c.userId) })
      if (donor?.email) {
        await sendEmail({
          to: donor.email,
          subject: 'Your payment is confirmed. Thank you!',
          html: pledgeConfirmedEmail(done.goal?.title ?? 'our work', money(done.c.amountCents ?? 0)),
        })
      }
      await logAdmin({
        actorId: admin.id,
        action: 'contribution_confirm',
        entity: 'contribution',
        entityId: id,
        summary: `${money(done.c.amountCents ?? 0)}${ref ? ` ref ${ref}` : ''}`,
      })
      refresh(done.goal?.slug)
      return { success: 'Payment confirmed and the progress bar updated.' }
    } catch (e) {
      if (e instanceof StateError) return { error: e.message }
      throw e
    }
  })
}

export async function rejectContribution(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const [c] = await db
      .update(contributions)
      .set({ status: 'rejected', confirmedBy: admin.id, confirmedAt: new Date() })
      .where(and(eq(contributions.id, id), eq(contributions.status, 'pledged')))
      .returning({ id: contributions.id })
    if (!c) return { error: 'This pledge is no longer waiting for confirmation.' }
    await logAdmin({ actorId: admin.id, action: 'contribution_reject', entity: 'contribution', entityId: id })
    refresh()
    return { success: 'Pledge rejected.' }
  })
}

/** A confirmed payment was returned: take it back out of the progress bar. */
export async function refundContribution(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    try {
      const slug = await db.transaction(async (tx) => {
        const [c] = await tx
          .update(contributions)
          .set({ status: 'refunded' })
          .where(and(eq(contributions.id, id), eq(contributions.status, 'confirmed')))
          .returning()
        if (!c) throw new StateError('Only confirmed payments can be refunded.')
        if (!c.goalId) return null
        const [g] = await tx
          .update(goals)
          .set({
            fundingRaisedCents: sql`greatest(0, ${goals.fundingRaisedCents} - ${c.amountCents ?? 0})`,
            updatedAt: new Date(),
          })
          .where(eq(goals.id, c.goalId))
          .returning({ slug: goals.slug })
        return g?.slug ?? null
      })
      await logAdmin({ actorId: admin.id, action: 'contribution_refund', entity: 'contribution', entityId: id })
      refresh(slug)
      return { success: 'Marked as refunded and removed from the progress bar.' }
    } catch (e) {
      if (e instanceof StateError) return { error: e.message }
      throw e
    }
  })
}
