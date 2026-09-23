'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { db } from '@/db'
import { contactEnquiries } from '@/db/schema'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendEmail, contactAckEmail, contactNotifyEmail } from '@/lib/email'
import type { ActionState } from './auth'

const contactSchema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  email: z.string().email('Enter a valid email address.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  // Honeypot field — real users never fill this in; bots usually do.
  company: z.string().max(0).optional().or(z.literal('')),
})

export async function submitContact(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    company: formData.get('company') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  if (parsed.data.company) {
    // Honeypot tripped — pretend success so bots don't learn anything.
    return { success: "Thanks — we'll be in touch soon." }
  }

  const turnstileToken = formData.get('cf-turnstile-response') as string | null
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()

  const verified = await verifyTurnstile(turnstileToken, ip)
  if (!verified) {
    return { error: 'Spam check failed. Please try again.' }
  }

  const { name, email, message } = parsed.data

  await db.insert(contactEnquiries).values({ name, email, message })

  await sendEmail({
    to: email,
    subject: "We've received your message",
    html: contactAckEmail(name),
  })

  const inbox = process.env.CONTACT_INBOX_EMAIL
  if (inbox) {
    await sendEmail({
      to: inbox,
      subject: `New contact form message from ${name}`,
      html: contactNotifyEmail(name, email, message),
    })
  }

  return { success: "Thanks — we'll be in touch soon." }
}
