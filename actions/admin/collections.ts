'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { collections, collectionStories } from '@/db/collections-schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { slugify } from '@/lib/slug'
import { COLLECTION_KINDS } from '@/lib/collection-constants'
import type { ActionState } from '../auth'

const uuid = z.string().uuid()

const schema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  slug: z.string().trim().max(80).optional(),
  kind: z.enum(COLLECTION_KINDS),
  description: z.string().trim().max(3000).optional(),
  coverImage: z.string().trim().url().optional().or(z.literal('')),
})

function refresh(slug?: string) {
  revalidatePath('/series')
  revalidatePath('/magazines')
  revalidatePath('/stories')
  revalidatePath('/admin/collections')
  revalidatePath('/sitemap.xml')
  if (slug) {
    revalidatePath(`/series/${slug}`)
    revalidatePath(`/magazines/${slug}`)
  }
}

export async function saveCollection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const parsed = schema.safeParse({
      id: formData.get('id') || undefined,
      title: formData.get('title'),
      slug: formData.get('slug') || undefined,
      kind: formData.get('kind'),
      description: formData.get('description') || undefined,
      coverImage: formData.get('coverImage') || '',
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data
    const slug = slugify(d.slug || d.title)
    if (!slug) return { error: 'Add a title or slug with letters or numbers.' }

    const [existing] = d.id ? await db.select().from(collections).where(eq(collections.id, d.id)).limit(1) : []
    if (d.id && !existing) return { error: 'This item no longer exists.' }

    const published = formData.get('published') === 'on'
    const values = {
      slug,
      kind: d.kind,
      title: d.title,
      description: d.description ?? null,
      coverImage: d.coverImage || null,
      publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    }

    if (existing) {
      await db.update(collections).set(values).where(eq(collections.id, existing.id))
      await logAdmin({ actorId: admin.id, action: 'collection_update', entity: 'collection', entityId: existing.id, summary: d.title })
      refresh(existing.slug)
      refresh(slug)
      revalidatePath(`/admin/collections/${existing.id}`)
      return { success: 'Saved.' }
    }
    const [row] = await db.insert(collections).values(values).returning({ id: collections.id })
    await logAdmin({ actorId: admin.id, action: 'collection_create', entity: 'collection', entityId: row.id, summary: d.title })
    refresh(slug)
    redirect(`/admin/collections/${row.id}?created=1`)
  })
}

export async function deleteCollection(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const cid = uuid.parse(id)
    const [row] = await db.select().from(collections).where(eq(collections.id, cid)).limit(1)
    await db.delete(collections).where(eq(collections.id, cid)) // stories are kept; only the grouping is removed
    await logAdmin({ actorId: admin.id, action: 'collection_delete', entity: 'collection', entityId: cid, summary: row?.title })
    refresh(row?.slug)
    redirect('/admin/collections')
  })
}

const memberSchema = z.object({
  collectionId: uuid,
  storyId: uuid,
  position: z.coerce.number().int().min(0).max(10000),
  issue: z.coerce.number().int().min(1).max(10000).optional(),
})

/** Put a story in a collection (or move/reorder it if it is already in one). */
export async function addStoryToCollection(
  collectionId: string,
  input: { storyId: string; position: string; issue: string },
): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = memberSchema.safeParse({
      collectionId,
      storyId: input.storyId,
      position: input.position || 0,
      issue: input.issue || undefined,
    })
    if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
    const [c] = await db.select().from(collections).where(eq(collections.id, p.data.collectionId)).limit(1)
    if (!c) return { error: 'This collection no longer exists.' }

    const issue = c.kind === 'magazine' ? (p.data.issue ?? null) : null
    await db
      .insert(collectionStories)
      .values({ storyId: p.data.storyId, collectionId: c.id, position: p.data.position, issue })
      .onConflictDoUpdate({
        target: collectionStories.storyId,
        set: { collectionId: c.id, position: p.data.position, issue },
      })
    await logAdmin({ actorId: admin.id, action: 'collection_story_add', entity: 'collection', entityId: c.id, summary: p.data.storyId })
    refresh(c.slug)
    revalidatePath(`/admin/collections/${c.id}`)
    return { success: 'Story added.' }
  })
}

export async function removeStoryFromCollection(collectionId: string, storyId: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ collectionId: uuid, storyId: uuid }).parse({ collectionId, storyId })
    await db
      .delete(collectionStories)
      .where(and(eq(collectionStories.collectionId, p.collectionId), eq(collectionStories.storyId, p.storyId)))
    const [c] = await db.select().from(collections).where(eq(collections.id, p.collectionId)).limit(1)
    await logAdmin({ actorId: admin.id, action: 'collection_story_remove', entity: 'collection', entityId: p.collectionId, summary: p.storyId })
    refresh(c?.slug)
    revalidatePath(`/admin/collections/${p.collectionId}`)
    return { success: 'Removed.' }
  })
}
