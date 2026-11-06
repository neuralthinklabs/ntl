import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { communities, communityMembers } from '@/db/community-schema'
import { getCurrentUserAndProfile } from '@/lib/auth/admin'

// Single source of truth for community permissions. Permissions are decided
// PER GROUP from the person's membership row (member / moderator / leader),
// plus two platform-level facts: NTL admin, and a community-wide restriction.
// Nothing here trusts the client; every server action goes through `guard`.

export type Community = typeof communities.$inferSelect
export type Membership = typeof communityMembers.$inferSelect

export type Viewer = {
  id: string
  email: string
  name: string
  isAdmin: boolean
  verified: boolean
  /** Banned or suspended community-wide by an admin. */
  blocked: boolean
}

export async function getViewer(): Promise<Viewer | null> {
  const { user, profile } = await getCurrentUserAndProfile()
  if (!user) return null
  const now = new Date()
  const blocked =
    !!profile?.communityBanned || (!!profile?.communitySuspendedUntil && profile.communitySuspendedUntil > now)
  return {
    id: user.id,
    email: user.email ?? '',
    name: profile?.fullName || profile?.ntlId || user.email?.split('@')[0] || 'Member',
    isAdmin: profile?.role === 'admin',
    verified: !!profile?.verifiedContributor,
    blocked,
  }
}

export type Access = {
  membership: Membership | null
  role: Membership['role'] | null
  /** Effective status (an expired suspension counts as active). */
  status: Membership['status'] | null
  isMember: boolean
  pending: boolean
  canView: boolean
  /** Comment, react, vote. */
  canInteract: boolean
  canPost: boolean
  canModerate: boolean
  canLead: boolean
  restricted: 'group' | 'platform' | 'archived' | null
}

export function resolveAccess(c: Community, v: Viewer | null, m: Membership | null): Access {
  const now = new Date()
  let status: Membership['status'] | null = m?.status ?? null
  if (status === 'suspended' && m?.suspendedUntil && m.suspendedUntil <= now) status = 'active'

  const admin = !!v?.isAdmin
  const active = status === 'active'
  const readable = status === 'active' || status === 'suspended'
  const platformBlocked = !!v?.blocked
  const archived = !!c.archivedAt

  const canView = admin || c.visibility === 'public' || readable
  const baseInteract = !!v && !platformBlocked && !archived
  const canInteract =
    baseInteract && (admin || (c.visibility === 'public' ? status === null || active : active))
  const canPost = baseInteract && (admin || active)
  const staff = active && (m?.role === 'moderator' || m?.role === 'leader')
  const canModerate = !!v && (admin || staff)
  const canLead = !!v && (admin || (active && m?.role === 'leader'))

  let restricted: Access['restricted'] = null
  if (platformBlocked) restricted = 'platform'
  else if (status === 'suspended' || status === 'banned') restricted = 'group'
  else if (archived) restricted = 'archived'

  return {
    membership: m,
    role: m?.role ?? null,
    status,
    isMember: readable,
    pending: status === 'pending',
    canView,
    canInteract,
    canPost,
    canModerate,
    canLead,
    restricted,
  }
}

export async function getMembership(communityId: string, userId: string) {
  const [m] = await db
    .select()
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1)
  return m ?? null
}

/**
 * Loads a group page's context. `internal` says which route family is asking:
 * /workspace only serves internal groups, /community only serves the others.
 * Returns null (so the page 404s) for a wrong route family or for an internal
 * group the viewer cannot see, so internal spaces never reveal they exist.
 */
export async function loadGroup(slug: string, internal: boolean) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  const [community] = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1)
  if (!community) return null
  if ((community.visibility === 'internal') !== internal) return null
  const viewer = await getViewer()
  const membership = viewer ? await getMembership(community.id, viewer.id) : null
  const access = resolveAccess(community, viewer, membership)
  if (community.visibility === 'internal' && !access.canView) return null
  return { community, viewer, access }
}

type Need = 'view' | 'interact' | 'post' | 'moderate' | 'lead'
const UUID_RE = /^[0-9a-f-]{36}$/i

export type GuardResult =
  | { ok: true; viewer: Viewer; community: Community; access: Access }
  | { ok: false; error: string }

/** The one authorization check every server action calls first. */
export async function guard(communityId: string, need: Need): Promise<GuardResult> {
  if (!UUID_RE.test(communityId)) return { ok: false, error: 'Group not found.' }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'Please log in first.' }
  const [community] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1)
  if (!community) return { ok: false, error: 'Group not found.' }
  const access = resolveAccess(community, viewer, await getMembership(community.id, viewer.id))

  const allowed = {
    view: access.canView,
    interact: access.canInteract,
    post: access.canPost,
    moderate: access.canModerate,
    lead: access.canLead,
  }[need]
  if (allowed) return { ok: true, viewer, community, access }

  // Internal groups never confirm they exist to people outside them.
  if (!access.canView) return { ok: false, error: 'Group not found.' }
  if (need === 'moderate' || need === 'lead') return { ok: false, error: 'You do not have permission to do that.' }
  if (access.restricted === 'platform') return { ok: false, error: 'Your community access is currently restricted.' }
  if (access.restricted === 'group') return { ok: false, error: 'You are restricted in this group.' }
  if (access.restricted === 'archived') return { ok: false, error: 'This group is archived.' }
  return { ok: false, error: 'Join this group first.' }
}
