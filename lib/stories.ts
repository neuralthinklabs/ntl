import { desc, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { stories } from '@/db/schema'

// P2 #15: /stories previously rendered from lib/data.ts mock arrays. This
// queries the real `stories` table (only rows with `published_at` set —
// drafts stay hidden). Requires the `category` column added in
// supabase/migrations/0003_p1_fixes.sql.

export type StoryCardData = {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  image: string
}

export async function getPublishedStories(limit = 50): Promise<StoryCardData[]> {
  const rows = await db.query.stories.findMany({
    where: isNotNull(stories.publishedAt),
    orderBy: [desc(stories.publishedAt)],
    limit,
  })

  return rows.map((s) => ({
    slug: s.slug,
    title: s.title,
    date: s.publishedAt
      ? new Date(s.publishedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    category: s.category ?? 'News',
    excerpt: s.excerpt ?? '',
    image: s.coverImage || '/images/story-community.png',
  }))
}

export function getStoryCategories(items: StoryCardData[]) {
  const unique = Array.from(new Set(items.map((s) => s.category)))
  return ['All', ...unique]
}
