'use server'

import { z } from 'zod'
import { db } from '@/db'
import { contactEnquiries } from '@/db/schema'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendEmail, contactAckEmail, contactNotifyEmail } from '@/lib/email'
import { checkRateLimit, recordAttempt, ipIdentifier } from '@/lib/rate-limit'
import { getClientIp as clientIp } from '@/lib/ip'
import type { ActionState } from './auth'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters.').max(5000),
  // Honeypot: must stay permissive (any string) so a bot-filled value reaches
  // the check below and gets a fake success instead of a telling error.
  company: z.string().optional().default(''),
})

const THANKS = "Thanks - we'll be in touch soon."

export async function submitContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    company: formData.get('company') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  if (parsed.data.company.trim().length > 0) return { success: THANKS }

  const ip = await clientIp()

  // Stops one client from using the form to mail arbitrary addresses.
  const key = ipIdentifier('contact', ip)
  const limit = await checkRateLimit(key, 5)
  if (!limit.allowed) {
    return { error: 'Too many messages from your connection. Please try again later.' }
  }

  const token = formData.get('cf-turnstile-response') as string | null
  if (!(await verifyTurnstile(token, ip))) {
    return { error: 'Spam check failed. Please try again.' }
  }
  await recordAttempt(key)

  const { name, email, message } = parsed.data
  await db.insert(contactEnquiries).values({ name, email, message })

  await sendEmail({ to: email, subject: "We've received your message", html: contactAckEmail(name) })

  const inbox = process.env.CONTACT_INBOX_EMAIL
  if (inbox) {
    await sendEmail({
      to: inbox,
      subject: `New contact form message from ${name}`,
      html: contactNotifyEmail(name, email, message),
    })
  }

  return { success: THANKS }
}
