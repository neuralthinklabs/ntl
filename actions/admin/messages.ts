'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { dmReports } from '@/db/collab-schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import type { ActionState } from '../auth'

/** Close a reported-message report. To act on the person, use Moderation > People (suspend or ban). */
export async function closeDmReport(reportId: string, outcome: 'resolved' | 'dismissed', note: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const id = z.string().uuid().safeParse(reportId)
    if (!id.success) return { error: 'Report not found.' }
    const updated = await db
      .update(dmReports)
      .set({ status: outcome, handledBy: admin.id, handledAt: new Date(), handlerNote: z.string().trim().max(500).parse(note ?? '') || null })
      .where(and(eq(dmReports.id, id.data), eq(dmReports.status, 'open')))
      .returning({ id: dmReports.id })
    if (!updated.length) return { error: 'This report was already handled.' }
    await logAdmin({ actorId: admin.id, action: `dm_report_${outcome}`, entity: 'dm_report', entityId: id.data })
    revalidatePath('/admin/community/messages')
    return { success: outcome === 'resolved' ? 'Report resolved.' : 'Report dismissed.' }
  })
}
