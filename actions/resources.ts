'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { groupResources } from '@/db/phase3-schema'
import { guard } from '@/lib/community/authz'
import { groupHref } from '@/lib/community/constants'
import { throttle } from '@/lib/collab/throttle'
import type { ActionState } from './auth'

const uuid = z.string().uuid()

const schema = z.object({
  communityId: uuid,
  title: z.string().trim().min(3, 'Give the resource a title (3+ characters).').max(160),
  url: z.string().trim().max(500).url('Enter a valid link.').refine((u) => u.startsWith('https://'), 'Links must start with https://').optional(),
  description: z.string().trim().max(3000).optional(),
})

/** Leaders and moderators add pinned guidelines, links and notes for their group. */
export async function addResource(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => (formData.get(k) as string) || undefined
  const p = schema.safeParse({ communityId: formData.get('communityId'), title: formData.get('title'), url: f('url'), description: f('description') })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  if (!p.data.url && !p.data.description) return { error: 'Add a link, some text, or both.' }
  const g = await guard(p.data.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (g.community.archivedAt) return { error: 'This group is archived.' }
  const limited = await throttle(`resource:add:${g.viewer.id}`, 30)
  if (limited) return limited

  await db.insert(groupResources).values({
    communityId: g.community.id,
    createdBy: g.viewer.id,
    title: p.data.title,
    url: p.data.url ?? null,
    description: p.data.description ?? null,
    pinned: formData.get('pinned') === 'on',
  })
  revalidatePath(groupHref(g.community))
  return { success: 'Added.' }
}

export async function deleteResource(id: string): Promise<ActionState> {
  if (!uuid.safeParse(id).success) return { error: 'Resource not found.' }
  const [r] = await db.select().from(groupResources).where(eq(groupResources.id, id)).limit(1)
  if (!r) return { error: 'Resource not found.' }
  const g = await guard(r.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  await db.delete(groupResources).where(eq(groupResources.id, r.id))
  revalidatePath(groupHref(g.community))
  return { success: 'Removed.' }
}
