import { pgTable, pgEnum, uuid, text, timestamp, integer, boolean, primaryKey, index } from 'drizzle-orm/pg-core'
import { profiles, atlasUnits, goals } from './schema'

// Migration 0019. Own file (like collections-schema.ts) so db/schema.ts only
// needs the three new profile columns. Use db.select()...; no relational entries.

export const communityKindEnum = pgEnum('community_kind', ['interest', 'atlas', 'project', 'learning', 'department', 'leadership', 'zone', 'operations'])
export const communityVisibilityEnum = pgEnum('community_visibility', ['public', 'private', 'internal'])
export const memberRoleEnum = pgEnum('community_member_role', ['member', 'moderator', 'leader'])
export const memberStatusEnum = pgEnum('community_member_status', ['active', 'pending', 'suspended', 'banned'])
export const postTypeEnum = pgEnum('community_post_type', ['discussion', 'idea', 'poll', 'announcement', 'research', 'event', 'project_update', 'resource'])
export const postStatusEnum = pgEnum('community_post_status', ['published', 'pending', 'removed'])
export const commentStatusEnum = pgEnum('community_comment_status', ['published', 'removed'])
export const reportStatusEnum = pgEnum('community_report_status', ['open', 'resolved', 'dismissed'])
export const modActionEnum = pgEnum('moderation_action_type', [
  'approve_post', 'remove_post', 'restore_post', 'remove_comment', 'restore_comment', 'warn', 'suspend', 'ban', 'unban',
  'remove_member', 'role_change', 'report_resolved', 'report_dismissed', 'appeal_upheld', 'appeal_overturned',
  'global_suspend', 'global_ban', 'global_unban',
])
export const appealStatusEnum = pgEnum('appeal_status', ['pending', 'upheld', 'overturned'])
export const notificationTypeEnum = pgEnum('community_notification_type', [
  'comment', 'reply', 'join_request', 'join_approved', 'announcement', 'post_pending', 'post_approved', 'post_removed',
  'warning', 'suspension', 'ban', 'appeal_decision', 'role_changed', 'report',
  'message', 'task_assigned', 'task_update', 'meeting_scheduled', 'meeting_cancelled', 'meeting_reminder',
])

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  kind: communityKindEnum('kind').notNull(),
  visibility: communityVisibilityEnum('visibility').notNull().default('public'),
  atlasScope: text('atlas_scope'),
  atlasUnitId: uuid('atlas_unit_id').references(() => atlasUnits.id, { onDelete: 'set null' }),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  coverImage: text('cover_image'),
  requirePostApproval: boolean('require_post_approval').notNull().default(false),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityMembers = pgTable(
  'community_members',
  {
    communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('member'),
    status: memberStatusEnum('status').notNull().default('active'),
    suspendedUntil: timestamp('suspended_until', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.communityId, t.userId] }), userIdx: index('community_members_user_idx').on(t.userId, t.status) }),
)

export const communityPosts = pgTable('community_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => profiles.id, { onDelete: 'set null' }),
  clientRequestId: uuid('client_request_id').unique(),
  type: postTypeEnum('type').notNull().default('discussion'),
  title: text('title'),
  body: text('body').notNull(),
  linkUrl: text('link_url'),
  eventStartsAt: timestamp('event_starts_at', { withTimezone: true }),
  eventLocation: text('event_location'),
  pollClosesAt: timestamp('poll_closes_at', { withTimezone: true }),
  status: postStatusEnum('status').notNull().default('published'),
  pinned: boolean('pinned').notNull().default(false),
  removedReason: text('removed_reason'),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pollOptions = pgTable('poll_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const pollVotes = pgTable(
  'poll_votes',
  {
    postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id').notNull().references(() => pollOptions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.postId, t.userId] }) }),
)

export const communityComments = pgTable('community_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  authorId: uuid('author_id').references(() => profiles.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  status: commentStatusEnum('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postReactions = pgTable(
  'post_reactions',
  {
    postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.postId, t.userId] }) }),
)

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'),
  actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userBlocks = pgTable(
  'user_blocks',
  {
    blockerId: uuid('blocker_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.blockerId, t.blockedId] }) }),
)

export const communityReports = pgTable('community_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  reporterId: uuid('reporter_id').references(() => profiles.id, { onDelete: 'set null' }),
  postId: uuid('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => communityComments.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  details: text('details'),
  status: reportStatusEnum('status').notNull().default('open'),
  handledBy: uuid('handled_by').references(() => profiles.id, { onDelete: 'set null' }),
  handledAt: timestamp('handled_at', { withTimezone: true }),
  handlerNote: text('handler_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').references(() => communities.id, { onDelete: 'set null' }),
  actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
  targetUserId: uuid('target_user_id').references(() => profiles.id, { onDelete: 'set null' }),
  postId: uuid('post_id').references(() => communityPosts.id, { onDelete: 'set null' }),
  commentId: uuid('comment_id').references(() => communityComments.id, { onDelete: 'set null' }),
  action: modActionEnum('action').notNull(),
  reason: text('reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityAppeals = pgTable('community_appeals', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionId: uuid('action_id').notNull().references(() => moderationActions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  status: appealStatusEnum('status').notNull().default('pending'),
  decidedBy: uuid('decided_by').references(() => profiles.id, { onDelete: 'set null' }),
  decisionNote: text('decision_note'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
