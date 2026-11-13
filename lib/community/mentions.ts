import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communityMembers, userBlocks } from '@/db/community-schema'
import { notify } from './notify'

const RE = /@(NTL-[A-Z0-9]{4}-[A-Z0-9]{4})\b/gi

/** NTL IDs mentioned in a text (max 5, upper-cased). */
export function extractMentions(text: string, max = 5): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(RE)) {
    out.add(m[1].toUpperCase())
    if (out.size >= max) break
  }
  return [...out]
}

/**
 * Notifies people @mentioned in a post or comment. Skips the author, banned
 * people, people who blocked the author, and (for private groups) anyone who
 * is not a member, so a mention can never leak a private discussion.
 * Never throws: a failed mention must not break the post.
 */
export async function notifyMentions(o: {
  text: string
  actor: { id: string; name: string }
  community: { id: string; name: string; visibility: string }
  link: string
}) {
  try {
    const ids = extractMentions(o.text)
    if (!ids.length) return
    const people = await db.select({ id: profiles.id, banned: profiles.communityBanned }).from(profiles).where(inArray(profiles.ntlId, ids))
    let targets = people.filter((p) => !p.banned && p.id !== o.actor.id).map((p) => p.id)
    if (!targets.length) return

    const blocks = await db
      .select({ by: userBlocks.blockerId })
      .from(userBlocks)
      .where(and(inArray(userBlocks.blockerId, targets), eq(userBlocks.blockedId, o.actor.id)))
    const blockedBy = new Set(blocks.map((b) => b.by))
    targets = targets.filter((t) => !blockedBy.has(t))

    if (o.community.visibility !== 'public' && targets.length) {
      const members = await db
        .select({ u: communityMembers.userId })
        .from(communityMembers)
        .where(and(eq(communityMembers.communityId, o.community.id), inArray(communityMembers.userId, targets), inArray(communityMembers.status, ['active', 'suspended'])))
      const ok = new Set(members.map((m) => m.u))
      targets = targets.filter((t) => ok.has(t))
    }
    await notify(
      targets.map((userId) => ({
        userId,
        type: 'mention' as const,
        title: `${o.actor.name} mentioned you in ${o.community.name}`,
        body: o.text.slice(0, 200),
        link: o.link,
        actorId: o.actor.id,
      })),
    )
  } catch (err) {
    console.error('[community] mentions failed:', err)
  }
}
