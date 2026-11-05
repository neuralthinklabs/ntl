import type { MetadataRoute } from 'next'
import { and, isNotNull, lte } from 'drizzle-orm'
import { db } from '@/db'
import { goals as campaigns, stories } from '@/db/schema'
import { collections } from '@/db/collections-schema'
import { goals as ntldgs } from '@/lib/ntldgs'
import { getAtlasCodes } from '@/lib/atlas'
import { COLLECTION_PATH } from '@/lib/collection-constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const staticPaths = ['', '/get-involved', '/atlas', '/ntldgs', '/portfolio', '/events', '/stories', '/series', '/magazines', '/support', '/volunteer', '/problems', '/contact', '/faq', '/developers', '/privacy', '/terms']

  let storyRows: { slug: string; updatedAt: Date }[] = []
  let campaignRows: { slug: string; updatedAt: Date }[] = []
  let collectionRows: { slug: string; kind: 'series' | 'magazine'; updatedAt: Date }[] = []
  try {
    ;[storyRows, campaignRows] = await Promise.all([
      db.select({ slug: stories.slug, updatedAt: stories.updatedAt }).from(stories).where(and(isNotNull(stories.publishedAt), lte(stories.publishedAt, new Date()))),
      db.select({ slug: campaigns.slug, updatedAt: campaigns.updatedAt }).from(campaigns),
    ])
  } catch {
    // The sitemap must still build if the database is unreachable at build time.
  }
  try {
    collectionRows = await db
      .select({ slug: collections.slug, kind: collections.kind, updatedAt: collections.updatedAt })
      .from(collections)
      .where(and(isNotNull(collections.publishedAt), lte(collections.publishedAt, new Date())))
  } catch {
    // Table not migrated yet (0018): skip collections rather than fail the build.
  }

  const atlasRows = await getAtlasCodes()

  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}` })),
    ...ntldgs.map((g) => ({ url: `${base}/ntldgs/${g.slug}` })),
    ...atlasRows.map((r) => ({ url: `${base}/atlas/${r.code}`, lastModified: r.updatedAt })),
    ...storyRows.map((s) => ({ url: `${base}/stories/${s.slug}`, lastModified: s.updatedAt })),
    ...collectionRows.map((c) => ({ url: `${base}${COLLECTION_PATH[c.kind]}/${c.slug}`, lastModified: c.updatedAt })),
    ...campaignRows.map((c) => ({ url: `${base}/goals/${c.slug}`, lastModified: c.updatedAt })),
  ]
}
