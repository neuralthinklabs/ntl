'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { profiles, volunteerApplications } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { sendEmail, escapeHtml } from '@/lib/email'
import type { ActionState } from '../auth'

const input = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'reviewing', 'accepted', 'declined']),
  notes: z.string().trim().max(2000),
})

const COPY: Record<string, string> = {
  reviewing: 'is now being reviewed by our team',
  accepted: 'has been accepted. Welcome to the team!',
  declined: 'was not taken forward this time. Thank you for offering your time',
}

export async function reviewVolunteer(id: string, status: z.infer<typeof input>['status'], notes: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = input.safeParse({ id, status, notes })
    if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }

    const [row] = await db
      .select({ app: volunteerApplications, email: profiles.email, role: profiles.role })
      .from(volunteerApplications)
      .innerJoin(profiles, eq(volunteerApplications.userId, profiles.id))
      .where(eq(volunteerApplications.id, p.data.id))
    if (!row) return { error: 'This application no longer exists.' }

    await db
      .update(volunteerApplications)
      .set({
        status: p.data.status,
        adminNotes: p.data.notes || null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(volunteerApplications.id, p.data.id))

    // Accepting someone gives them the volunteer workspace (/team). Only ever
    // upgrades a plain member; it never touches admin or core-team roles.
    let promoted = false
    if (p.data.status === 'accepted' && row.role === 'member') {
      await db.update(profiles).set({ role: 'volunteer', updatedAt: new Date() }).where(eq(profiles.id, row.app.userId))
      promoted = true
    }

    if (row.app.status !== p.data.status && row.email && COPY[p.data.status]) {
      const note = p.data.notes
        ? `<p style="background:#f4f6f8;padding:12px;border-radius:8px"><strong>Note from the team:</strong><br/>${escapeHtml(p.data.notes)}</p>`
        : ''
      await sendEmail({
        to: row.email,
        subject: 'Update on your volunteer application',
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0d0f12;line-height:1.55"><h2>Update on your application</h2><p>Your volunteer application ${escapeHtml(COPY[p.data.status])}.</p>${note}<p style="color:#555">Neural Think Labs</p></div>`,
      })
    }

    await logAdmin({
      actorId: admin.id,
      action: 'volunteer_review',
      entity: 'volunteer_application',
      entityId: p.data.id,
      summary: `${row.app.status} -> ${p.data.status}${promoted ? ' (role set to volunteer)' : ''}`,
    })
    revalidatePath('/admin/volunteers')
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { success: promoted ? 'Saved. They are now a volunteer and have a workspace.' : 'Saved.' }
  })
}
