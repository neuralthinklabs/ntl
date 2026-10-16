'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { ROLES, type Role } from '@/lib/roles'
import type { ActionState } from '../auth'

export async function setUserRole(userId: string, role: Role): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ userId: z.string().uuid(), role: z.enum(ROLES) }).parse({ userId, role })
    if (p.userId === admin.id) return { error: 'You cannot change your own role.' }
    await db.update(profiles).set({ role: p.role, updatedAt: new Date() }).where(eq(profiles.id, p.userId))
    await logAdmin({ actorId: admin.id, action: 'set_role', entity: 'profile', entityId: p.userId, summary: p.role })
    revalidatePath('/admin/users')
    revalidatePath('/admin/assignments/problems')
    return { success: 'Role updated.' }
  })
}
