import { and, count, desc, eq, isNotNull, isNull, lte, or } from 'drizzle-orm'
import { db } from '@/db'
import { stories } from '@/db/schema'

export type StoryCardData = {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  image: string | null
}

export const STORIES_PAGE_SIZE = 12

const dateFmt = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const live = () => and(isNotNull(stories.publishedAt), lte(stories.publishedAt, new Date()))

function toCard(s: typeof stories.$inferSelect): StoryCardData {
  return {
    slug: s.slug,
    title: s.title,
    date: s.publishedAt ? dateFmt(new Date(s.publishedAt)) : '',
    category: s.category ?? 'News',
    excerpt: s.excerpt ?? '',
    image: s.coverImage,
  }
}

export async function getPublishedStories(limit = 50): Promise<StoryCardData[]> {
  const rows = await db.query.stories.findMany({
    where: live(),
    orderBy: [desc(stories.publishedAt)],
    limit,
  })
  return rows.map(toCard)
}

/** One page of published stories, optionally filtered by category (server-side). */
export async function getStoriesPage({ page, category }: { page: number; category?: string }) {
  // Rows with no category are shown as "News" (see toCard), so filter the same way.
  const byCategory =
    !category || category === 'All'
      ? undefined
      : category === 'News'
        ? or(eq(stories.category, 'News'), isNull(stories.category))
        : eq(stories.category, category)
  const where = and(live(), byCategory)

  const [rows, [{ value }]] = await Promise.all([
    db.query.stories.findMany({
      where,
      orderBy: [desc(stories.publishedAt)],
      limit: STORIES_PAGE_SIZE,
      offset: (page - 1) * STORIES_PAGE_SIZE,
    }),
    db.select({ value: count() }).from(stories).where(where),
  ])
  return { items: rows.map(toCard), total: value }
}

/** Categories that actually have a published story, with "All" first. */
export async function getStoryCategoryList() {
  const rows = await db.selectDistinct({ category: stories.category }).from(stories).where(live())
  const set = new Set(rows.map((r) => r.category ?? 'News'))
  return ['All', ...Array.from(set).sort()]
}

export async function getLatestStory() {
  const [row] = await db.query.stories.findMany({ where: live(), orderBy: [desc(stories.publishedAt)], limit: 1 })
  return row ? toCard(row) : null
}

export async function getStoriesForGoal(ntldgSlug: string, limit = 3) {
  const rows = await db.query.stories.findMany({
    where: and(live(), eq(stories.ntldgSlug, ntldgSlug)),
    orderBy: [desc(stories.publishedAt)],
    limit,
  })
  return rows.map(toCard)
}

export async function getStoryBySlug(slug: string) {
  const row = await db.query.stories.findFirst({
    where: and(eq(stories.slug, slug), live()),
    with: { author: { columns: { fullName: true, ntlId: true, showCredit: true, bio: true } } },
  })
  if (!row) return null
  // The byline respects the author's "show my name publicly" choice.
  const credited = row.author?.showCredit ? row.author : null
  return {
    ...toCard(row),
    body: row.body ?? '',
    ntldgSlug: row.ntldgSlug,
    updatedAt: row.updatedAt,
    authorName: credited ? credited.fullName || credited.ntlId : null,
    authorNtlId: credited?.ntlId ?? null,
    authorBio: credited?.bio ?? null,
  }
}

export function getStoryCategories(items: StoryCardData[]) {
  return ['All', ...Array.from(new Set(items.map((s) => s.category)))]
}

export { STORY_CATEGORIES } from './story-categories'
