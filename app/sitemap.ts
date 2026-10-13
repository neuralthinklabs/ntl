import type { MetadataRoute } from 'next'
import { and, isNotNull, lte } from 'drizzle-orm'
import { db } from '@/db'
import { goals as campaigns, stories } from '@/db/schema'
import { goals as ntldgs } from '@/lib/ntldgs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const staticPaths = ['', '/about', '/ntldgs', '/portfolio', '/events', '/stories', '/support', '/volunteer', '/problems', '/contact', '/faq', '/privacy', '/terms']

  let storyRows: { slug: string; updatedAt: Date }[] = []
  let campaignRows: { slug: string; updatedAt: Date }[] = []
  try {
    ;[storyRows, campaignRows] = await Promise.all([
      db.select({ slug: stories.slug, updatedAt: stories.updatedAt }).from(stories).where(and(isNotNull(stories.publishedAt), lte(stories.publishedAt, new Date()))),
      db.select({ slug: campaigns.slug, updatedAt: campaigns.updatedAt }).from(campaigns),
    ])
  } catch {
    // The sitemap must still build if the database is unreachable at build time.
  }

  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}` })),
    ...ntldgs.map((g) => ({ url: `${base}/ntldgs/${g.slug}` })),
    ...storyRows.map((s) => ({ url: `${base}/stories/${s.slug}`, lastModified: s.updatedAt })),
    ...campaignRows.map((c) => ({ url: `${base}/goals/${c.slug}`, lastModified: c.updatedAt })),
  ]
}
