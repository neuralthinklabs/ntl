import { and, asc, desc, eq, isNotNull, lte } from 'drizzle-orm'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { collections, collectionStories } from '@/db/collections-schema'
import type { CollectionKind } from './collection-constants'

export * from './collection-constants'

const liveCollection = () => and(isNotNull(collections.publishedAt), lte(collections.publishedAt, new Date()))
const liveStory = () => and(isNotNull(stories.publishedAt), lte(stories.publishedAt, new Date()))

/** Published stories of one collection, in reading order. */
async function storiesOf(collectionId: string) {
  return db
    .select({
      id: stories.id,
      slug: stories.slug,
      title: stories.title,
      excerpt: stories.excerpt,
      publishedAt: stories.publishedAt,
      issue: collectionStories.issue,
      position: collectionStories.position,
    })
    .from(collectionStories)
    .innerJoin(stories, eq(collectionStories.storyId, stories.id))
    .where(and(eq(collectionStories.collectionId, collectionId), liveStory()))
    .orderBy(asc(collectionStories.issue), asc(collectionStories.position), asc(stories.publishedAt))
}

export async function listCollections(kind: CollectionKind) {
  return db
    .select()
    .from(collections)
    .where(and(eq(collections.kind, kind), liveCollection()))
    .orderBy(desc(collections.publishedAt))
}

export async function getCollection(kind: CollectionKind, slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  const [c] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.kind, kind), liveCollection()))
    .limit(1)
  if (!c) return null
  return { ...c, stories: await storiesOf(c.id) }
}

/** For a story page: its collection, its place in it, and the neighbours. */
export async function getCollectionContextBySlug(storySlug: string) {
  const [m] = await db
    .select({ storyId: stories.id, collectionId: collectionStories.collectionId })
    .from(stories)
    .innerJoin(collectionStories, eq(collectionStories.storyId, stories.id))
    .where(eq(stories.slug, storySlug))
    .limit(1)
  if (!m) return null
  const [c] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, m.collectionId), liveCollection()))
    .limit(1)
  if (!c) return null
  const items = await storiesOf(c.id)
  const i = items.findIndex((s) => s.id === m.storyId)
  if (i < 0) return null
  return {
    collection: c,
    index: i,
    total: items.length,
    issue: items[i].issue,
    prev: items[i - 1] ?? null,
    next: items[i + 1] ?? null,
  }
}
