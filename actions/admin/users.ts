'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import type { ActionState } from '../auth'

export async function setUserRole(userId: string, role: 'member' | 'admin'): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ userId: z.string().uuid(), role: z.enum(['member', 'admin']) }).parse({ userId, role })
    if (p.userId === admin.id) return { error: 'You cannot change your own role.' }
    await db.update(profiles).set({ role: p.role, updatedAt: new Date() }).where(eq(profiles.id, p.userId))
    revalidatePath('/admin/users')
    return { success: p.role === 'admin' ? 'Now an admin.' : 'Now a member.' }
  })
}
