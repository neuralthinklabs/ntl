'use server'

import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles, volunteerApplications } from '@/db/schema'
import { sendEmail, escapeHtml } from '@/lib/email'
import { checkRateLimit, recordAttempt } from '@/lib/rate-limit'
import { goalIndexBySlug } from '@/lib/ntldgs'
import type { ActionState } from './auth'

const opt = (max: number) => z.string().trim().max(max).optional()

const schema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name.').max(120),
  phone: opt(30),
  location: z.string().trim().min(2, 'Tell us where you are based.').max(200),
  skills: z.string().trim().min(10, 'Describe your skills (at least 10 characters).').max(2000),
  hoursPerWeek: z.coerce
    .number({ invalid_type_error: 'Hours per week must be a number.' })
    .int('Hours per week must be a whole number.')
    .min(1, 'Hours per week must be at least 1.')
    .max(80, 'Hours per week must be 80 or fewer.')
    .optional(),
  availability: opt(500),
  experience: opt(3000),
  motivation: z.string().trim().min(20, 'Tell us why you want to volunteer (at least 20 characters).').max(3000),
  links: opt(1000),
  clientRequestId: z.string().uuid('Please reload the page and try again.'),
})

export async function submitVolunteer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in to apply.' }

  const key = `volunteer:user:${user.id}`
  if (!(await checkRateLimit(key, 3)).allowed) {
    return { error: 'Too many applications in a short time. Please try again in a few minutes.' }
  }

  const parsed = schema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || undefined,
    location: formData.get('location'),
    skills: formData.get('skills'),
    hoursPerWeek: formData.get('hoursPerWeek') || undefined,
    availability: formData.get('availability') || undefined,
    experience: formData.get('experience') || undefined,
    motivation: formData.get('motivation'),
    links: formData.get('links') || undefined,
    clientRequestId: formData.get('clientRequestId'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  await recordAttempt(key)
  const d = parsed.data

  const ntldgSlugs = [...new Set(formData.getAll('ntldg').map(String))].filter((s) => goalIndexBySlug(s) >= 0).slice(0, 12)

  // Double-click / retry of the same form load.
  const same = await db.query.volunteerApplications.findFirst({
    where: eq(volunteerApplications.clientRequestId, d.clientRequestId),
  })
  if (same) return { success: 'Your application is already received. Thank you!' }

  const open = await db.query.volunteerApplications.findFirst({
    where: and(eq(volunteerApplications.userId, user.id), inArray(volunteerApplications.status, ['new', 'reviewing'])),
  })
  if (open) return { error: 'You already have an application under review. We will email you when it changes.' }

  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? '' })
    .onConflictDoNothing({ target: profiles.id })

  const [row] = await db
    .insert(volunteerApplications)
    .values({
      userId: user.id,
      clientRequestId: d.clientRequestId,
      fullName: d.fullName,
      phone: d.phone ?? null,
      location: d.location,
      skills: d.skills,
      ntldgSlugs,
      hoursPerWeek: d.hoursPerWeek ?? null,
      availability: d.availability ?? null,
      experience: d.experience ?? null,
      motivation: d.motivation,
      links: d.links ?? null,
    })
    .onConflictDoNothing({ target: volunteerApplications.clientRequestId })
    .returning({ id: volunteerApplications.id })
  if (!row) return { success: 'Your application is already received. Thank you!' }

  const wrap = (inner: string) =>
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0d0f12;line-height:1.55">${inner}<p style="color:#555">Neural Think Labs</p></div>`

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: 'We received your volunteer application',
      html: wrap(
        `<h2>Thanks for applying, ${escapeHtml(d.fullName)}</h2><p>Our team reviews applications within 1-2 weeks and will email you when the status changes.</p>`,
      ),
    })
  }
  const inbox = process.env.CONTACT_INBOX_EMAIL
  if (inbox) {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/volunteers`
    await sendEmail({
      to: inbox,
      subject: `New volunteer application: ${d.fullName}`.replace(/[\r\n]+/g, ' '),
      html: wrap(
        `<h2>New volunteer application</h2><p><strong>${escapeHtml(d.fullName)}</strong> (${escapeHtml(user.email ?? 'no email')})</p><p><a href="${escapeHtml(url)}">Review it in the admin portal</a></p>`,
      ),
    })
  }

  revalidatePath('/admin')
  revalidatePath('/admin/volunteers')
  return { success: 'Application received. We will email you within 1-2 weeks.' }
}
