'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { goals, contributions } from '@/db/schema'
import { sendEmail, pledgeReceivedEmail, pledgeAdminNotifyEmail } from '@/lib/email'
import { money } from '@/lib/format'
import type { ActionState } from './auth'

// A pledge is only a promise. The public progress bar changes ONLY when an
// admin confirms the payment (actions/admin/contributions.ts).
const MAX_PLEDGE_DOLLARS = 100_000

const pledgeSchema = z.object({
  goalId: z.string().uuid(),
  amount: z.coerce
    .number()
    .positive('Enter an amount greater than 0.')
    .max(MAX_PLEDGE_DOLLARS, `For pledges above $${MAX_PLEDGE_DOLLARS.toLocaleString()}, please contact us.`),
  note: z.string().max(300).optional(),
  clientRequestId: z.string().uuid('Please reload the page and try again.'),
})

export async function recordContribution(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in to pledge your support.' }

  const parsed = pledgeSchema.safeParse({
    goalId: formData.get('goalId'),
    amount: formData.get('amount'),
    note: formData.get('note') || undefined,
    clientRequestId: formData.get('clientRequestId'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const { goalId, amount, note, clientRequestId } = parsed.data
  const goal = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (!goal) return { error: 'This campaign no longer exists. Please refresh the page.' }

  const amountCents = Math.round(amount * 100)

  const [inserted] = await db
    .insert(contributions)
    .values({ userId: user.id, goalId: goal.id, clientRequestId, amountCents, kind: 'donation', note })
    .onConflictDoNothing({ target: contributions.clientRequestId })
    .returning()

  // Double-click / retry of the same request: already recorded.
  if (!inserted) return { success: 'Your pledge is already recorded. Thank you!' }

  const ref = inserted.id.slice(0, 8).toUpperCase()
  const label = money(amountCents)

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your pledge to ${goal.title} (ref ${ref})`,
      html: pledgeReceivedEmail(goal.title, label, ref, process.env.PAYMENT_INSTRUCTIONS ?? ''),
    })
  }
  const inbox = process.env.CONTACT_INBOX_EMAIL
  if (inbox) {
    await sendEmail({
      to: inbox,
      subject: `New pledge: ${label} to ${goal.title}`,
      html: pledgeAdminNotifyEmail(user.email ?? 'A member', goal.title, label, `${process.env.NEXT_PUBLIC_SITE_URL}/admin/contributions`),
    })
  }

  revalidatePath('/contributions/mine')
  revalidatePath('/admin/contributions')
  revalidatePath('/admin')
  return {
    success: `Pledge recorded (ref ${ref}). We emailed you the next steps. The progress bar updates once our team confirms your payment.`,
  }
}
