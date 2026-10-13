'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { portfolioItems } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import type { ActionState } from '../auth'

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Enter a name.').max(120),
  type: z.enum(['Product', 'Service', 'Venture', 'System', 'Publication']),
  status: z.enum(['Active', 'In Progress', 'Planned', 'Completed']),
  description: z.string().trim().min(5, 'Add a short description.').max(600),
  sortOrder: z.coerce.number().int().min(0).max(10000),
})

function refresh() {
  revalidatePath('/')
  revalidatePath('/portfolio')
  revalidatePath('/admin/portfolio')
}

export async function savePortfolioItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    const parsed = schema.safeParse({
      id: formData.get('id') || undefined,
      name: formData.get('name'),
      type: formData.get('type'),
      status: formData.get('status'),
      description: formData.get('description'),
      sortOrder: formData.get('sortOrder') || 0,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const { id, ...v } = parsed.data
    const values = { ...v, updatedAt: new Date() }

    if (id) {
      await db.update(portfolioItems).set(values).where(eq(portfolioItems.id, id))
      refresh()
      return { success: 'Saved.' }
    }
    const [row] = await db.insert(portfolioItems).values(values).returning({ id: portfolioItems.id })
    refresh()
    redirect(`/admin/portfolio/${row.id}?created=1`)
  })
}

export async function deletePortfolioItem(id: string): Promise<ActionState> {
  return runAdmin(async () => {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id))
    refresh()
    redirect('/admin/portfolio')
  })
}
