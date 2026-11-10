import { pgTable, uuid, text, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core'
import { profiles } from './schema'
import { communities, communityPosts } from './community-schema'

// Migration 0021. Own file (like community-schema.ts); use db.select()..., no relational entries.

export const postAttachments = pgTable('post_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const dmConversations = pgTable('dm_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userLow: uuid('user_low').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  userHigh: uuid('user_high').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  lowReadAt: timestamp('low_read_at', { withTimezone: true }),
  highReadAt: timestamp('high_read_at', { withTimezone: true }),
})

export const dmMessages = pgTable('dm_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => dmConversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => profiles.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const dmReports = pgTable('dm_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => dmConversations.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => dmMessages.id, { onDelete: 'set null' }),
  reporterId: uuid('reporter_id').references(() => profiles.id, { onDelete: 'set null' }),
  reportedUserId: uuid('reported_user_id').references(() => profiles.id, { onDelete: 'set null' }),
  reason: text('reason').notNull(),
  details: text('details'),
  snapshot: text('snapshot').notNull(),
  status: text('status', { enum: ['open', 'resolved', 'dismissed'] }).notNull().default('open'),
  handledBy: uuid('handled_by').references(() => profiles.id, { onDelete: 'set null' }),
  handledAt: timestamp('handled_at', { withTimezone: true }),
  handlerNote: text('handler_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityMeetings = pgTable('community_meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  agenda: text('agenda'),
  location: text('location'),
  meetingUrl: text('meeting_url'),
  timezone: text('timezone').notNull().default('UTC'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  status: text('status', { enum: ['scheduled', 'cancelled'] }).notNull().default('scheduled'),
  cancelReason: text('cancel_reason'),
  minutes: text('minutes'),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const meetingRsvps = pgTable(
  'meeting_rsvps',
  {
    meetingId: uuid('meeting_id').notNull().references(() => communityMeetings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    response: text('response', { enum: ['going', 'maybe', 'no'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.meetingId, t.userId] }) }),
)

export const communityTasks = pgTable('community_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['todo', 'in_progress', 'review', 'done'] }).notNull().default('todo'),
  priority: text('priority', { enum: ['low', 'normal', 'high'] }).notNull().default('normal'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => communityTasks.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => profiles.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const communityEmailPrefs = pgTable('community_email_prefs', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  digest: text('digest', { enum: ['off', 'daily', 'weekly'] }).notNull().default('off'),
  lastDigestAt: timestamp('last_digest_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
