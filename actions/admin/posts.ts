'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { collections, collectionStories } from '@/db/collections-schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { slugify } from '@/lib/slug'
import { goalIndexBySlug } from '@/lib/ntldgs'
import type { ActionState } from '../auth'

const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  slug: z.string().trim().max(80).optional(),
  category: z.string().trim().min(1, 'Choose a category.').max(60),
  excerpt: z.string().trim().max(400).optional(),
  body: z.string().max(60000).optional(),
  coverImage: z.string().trim().url().optional().or(z.literal('')),
  ntldgSlug: z.string().optional(),
  collectionId: z.string().uuid().optional(),
  position: z.coerce.number().int().min(0).max(10000).default(0),
  issue: z.coerce.number().int().min(1).max(10000).optional(),
  intent: z.enum(['draft', 'publish']),
})

function refresh(slug?: string) {
  revalidatePath('/')
  revalidatePath('/stories')
  revalidatePath('/series')
  revalidatePath('/magazines')
  revalidatePath('/admin/posts')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath(`/stories/${slug}`)
}

/** Series / magazine membership lives in collection_stories (a story is in at most one collection). */
async function syncCollection(storyId: string, d: { collectionId?: string; position: number; issue?: number }) {
  if (!d.collectionId) {
    await db.delete(collectionStories).where(eq(collectionStories.storyId, storyId))
    return null
  }
  const [c] = await db.select().from(collections).where(eq(collections.id, d.collectionId)).limit(1)
  if (!c) return 'That series or magazine no longer exists.'
  const issue = c.kind === 'magazine' ? (d.issue ?? null) : null
  await db
    .insert(collectionStories)
    .values({ storyId, collectionId: c.id, position: d.position, issue })
    .onConflictDoUpdate({ target: collectionStories.storyId, set: { collectionId: c.id, position: d.position, issue } })
  return null
}

export async function savePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (user) => {
    const parsed = postSchema.safeParse({
      id: formData.get('id') || undefined,
      title: formData.get('title'),
      slug: formData.get('slug') || undefined,
      category: formData.get('category'),
      excerpt: formData.get('excerpt') || undefined,
      body: formData.get('body') || undefined,
      coverImage: formData.get('coverImage') || '',
      ntldgSlug: formData.get('ntldgSlug') || undefined,
      collectionId: formData.get('collectionId') || undefined,
      position: formData.get('position') || 0,
      issue: formData.get('issue') || undefined,
      intent: formData.get('intent'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    const slug = slugify(d.slug || d.title)
    if (!slug) return { error: 'Add a title or slug with letters or numbers.' }
    const ntldgSlug = d.ntldgSlug && goalIndexBySlug(d.ntldgSlug) >= 0 ? d.ntldgSlug : null

    const existing = d.id ? await db.query.stories.findFirst({ where: eq(stories.id, d.id) }) : null
    if (d.id && !existing) return { error: 'This post no longer exists.' }

    const publishedAt = d.intent === 'publish' ? (existing?.publishedAt ?? new Date()) : null

    const values = {
      slug,
      title: d.title,
      category: d.category,
      excerpt: d.excerpt ?? null,
      body: d.body ?? null,
      coverImage: d.coverImage || null,
      ntldgSlug,
      publishedAt,
      updatedAt: new Date(),
    }

    if (existing) {
      await db.update(stories).set(values).where(eq(stories.id, existing.id))
      const problem = await syncCollection(existing.id, d)
      await logAdmin({
        actorId: user.id,
        action: d.intent === 'publish' ? 'post_publish' : 'post_save_draft',
        entity: 'post',
        entityId: existing.id,
        summary: d.title,
      })
      refresh(existing.slug)
      refresh(slug)
      if (problem) return { error: `Post saved, but: ${problem}` }
      return { success: d.intent === 'publish' ? 'Published.' : 'Saved as draft.' }
    }

    const [row] = await db
      .insert(stories)
      .values({ ...values, authorId: user.id })
      .returning({ id: stories.id })
    await syncCollection(row.id, d)
    await logAdmin({
      actorId: user.id,
      action: d.intent === 'publish' ? 'post_publish' : 'post_create',
      entity: 'post',
      entityId: row.id,
      summary: d.title,
    })
    refresh(slug)
    redirect(`/admin/posts/${row.id}?created=1`)
  })
}

export async function deletePost(id: string): Promise<ActionState> {
  return runAdmin(async (user) => {
    const row = await db.query.stories.findFirst({ where: eq(stories.id, id) })
    await db.delete(stories).where(eq(stories.id, id))
    await logAdmin({ actorId: user.id, action: 'post_delete', entity: 'post', entityId: id, summary: row?.title })
    refresh(row?.slug)
    redirect('/admin/posts')
  })
}
