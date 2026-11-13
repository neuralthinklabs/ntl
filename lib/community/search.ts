import 'server-only'
import { and, desc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communities, communityPosts } from '@/db/community-schema'

const escapeLike = (q: string) => q.replace(/[\\%_]/g, '\\$&')

/**
 * Full-text search over published posts the viewer may already read: public
 * groups and groups they belong to. Internal groups never appear, and people
 * the viewer blocked are hidden. The to_tsvector expression matches the
 * index created in migration 0023.
 */
export async function searchPosts(o: { viewerId: string | null; q: string; limit?: number }) {
  const tsv = sql`to_tsvector('english', coalesce(${communityPosts.title}, '') || ' ' || ${communityPosts.body})`
  const query = sql`websearch_to_tsquery('english', ${o.q})`
  const member = o.viewerId
    ? sql`${communityPosts.communityId} in (select community_id from community_members where user_id = ${o.viewerId} and status in ('active','suspended'))`
    : sql`false`
  const conds: (SQL | undefined)[] = [
    eq(communityPosts.status, 'published'),
    ne(communities.visibility, 'internal'),
    sql`${communities.archivedAt} is null`,
    or(eq(communities.visibility, 'public'), member),
    sql`${tsv} @@ ${query}`,
    o.viewerId ? sql`not exists (select 1 from user_blocks b where b.blocker_id = ${o.viewerId} and b.blocked_id = ${communityPosts.authorId})` : undefined,
  ]
  const rows = await db
    .select({
      id: communityPosts.id,
      type: communityPosts.type,
      title: communityPosts.title,
      body: communityPosts.body,
      createdAt: communityPosts.createdAt,
      communityName: communities.name,
      communitySlug: communities.slug,
      communityVisibility: communities.visibility,
      authorName: sql<string | null>`case when ${profiles.showCredit} then coalesce(${profiles.fullName}, ${profiles.ntlId}) else ${profiles.ntlId} end`,
      authorNtlId: profiles.ntlId,
    })
    .from(communityPosts)
    .innerJoin(communities, eq(communityPosts.communityId, communities.id))
    .leftJoin(profiles, eq(communityPosts.authorId, profiles.id))
    .where(and(...conds))
    .orderBy(desc(sql`ts_rank(${tsv}, ${query})`), desc(communityPosts.createdAt))
    .limit(o.limit ?? 20)
  return rows
}

/** People who allow public credit, by name or NTL ID. */
export async function searchPeople(q: string, limit = 10) {
  const like = `%${escapeLike(q)}%`
  return db
    .select({ ntlId: profiles.ntlId, name: profiles.fullName, verified: profiles.verifiedContributor })
    .from(profiles)
    .where(and(eq(profiles.showCredit, true), eq(profiles.communityBanned, false), or(ilike(profiles.fullName, like), ilike(profiles.ntlId, like))))
    .orderBy(profiles.fullName)
    .limit(limit)
}
