// Safe to import from client components (no DB imports).
export const COMMUNITY_KINDS = ['interest', 'atlas', 'project', 'learning', 'department', 'leadership', 'zone', 'operations'] as const
export type CommunityKind = (typeof COMMUNITY_KINDS)[number]
export const PUBLIC_KINDS = ['interest', 'atlas', 'project', 'learning'] as const
export const INTERNAL_KINDS = ['department', 'leadership', 'zone', 'operations'] as const
export const isInternalKind = (k: string) => (INTERNAL_KINDS as readonly string[]).includes(k)

export const KIND_LABEL: Record<string, string> = {
  interest: 'Interest group',
  atlas: 'Atlas community',
  project: 'Project group',
  learning: 'Learning community',
  department: 'Department',
  leadership: 'Leadership',
  zone: 'Zone leaders',
  operations: 'Operations',
}
export const KIND_PLURAL: Record<string, string> = {
  interest: 'Interest groups',
  atlas: 'Atlas communities',
  project: 'Project groups',
  learning: 'Learning communities',
}

export const VISIBILITIES = ['public', 'private', 'internal'] as const
export const VISIBILITY_LABEL: Record<string, string> = {
  public: 'Public',
  private: 'Private',
  internal: 'Internal',
}
export const VISIBILITY_HELP: Record<string, string> = {
  public: 'Anyone can read. Signed-in people join instantly.',
  private: 'Listed, but content is for members. Joining needs approval.',
  internal: 'Hidden from everyone except invited members and admins.',
}

export const ATLAS_SCOPES = ['national', 'zone', 'region', 'city'] as const
export const ATLAS_SCOPE_LABEL: Record<string, string> = {
  national: 'National',
  zone: 'Zone',
  region: 'Region (state)',
  city: 'City / cluster',
}

export const POST_TYPES = ['discussion', 'idea', 'poll', 'announcement', 'research', 'event', 'project_update', 'resource'] as const
export type PostType = (typeof POST_TYPES)[number]
export const POST_TYPE_LABEL: Record<string, string> = {
  discussion: 'Discussion',
  idea: 'Idea',
  poll: 'Poll',
  announcement: 'Announcement',
  research: 'Research',
  event: 'Event',
  project_update: 'Project update',
  resource: 'Resource',
}

export const REACTION_KINDS = ['like', 'insightful', 'support'] as const
export const REACTION_LABEL: Record<string, string> = { like: 'Like', insightful: 'Insightful', support: 'Support' }

export const REPORT_REASONS = ['spam', 'harassment', 'misinformation', 'off_topic', 'unsafe', 'other'] as const
export const REPORT_LABEL: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment or abuse',
  misinformation: 'Misinformation',
  off_topic: 'Off topic',
  unsafe: 'Unsafe or illegal',
  other: 'Something else',
}

export const MEMBER_ROLES = ['member', 'moderator', 'leader'] as const
export const ROLE_LABEL: Record<string, string> = { member: 'Member', moderator: 'Moderator', leader: 'Leader' }

export const MOD_ACTION_LABEL: Record<string, string> = {
  approve_post: 'Post approved',
  remove_post: 'Post removed',
  restore_post: 'Post restored',
  remove_comment: 'Comment removed',
  restore_comment: 'Comment restored',
  warn: 'Warning',
  suspend: 'Suspension',
  ban: 'Ban',
  unban: 'Restriction lifted',
  remove_member: 'Removed from group',
  role_change: 'Role changed',
  report_resolved: 'Report resolved',
  report_dismissed: 'Report dismissed',
  appeal_upheld: 'Appeal rejected',
  appeal_overturned: 'Appeal accepted',
  global_suspend: 'Community-wide suspension',
  global_ban: 'Community-wide ban',
  global_unban: 'Community-wide restriction lifted',
}
/** Actions a person may appeal. */
export const APPEALABLE = ['remove_post', 'remove_comment', 'warn', 'suspend', 'ban', 'remove_member', 'global_suspend', 'global_ban'] as const

export const groupHref = (c: { slug: string; visibility: string }) =>
  c.visibility === 'internal' ? `/workspace/${c.slug}` : `/community/g/${c.slug}`
