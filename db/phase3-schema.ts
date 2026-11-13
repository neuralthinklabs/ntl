import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { profiles } from './schema'
import { communities } from './community-schema'

// Migration 0023.
export const groupResources = pgTable('group_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  url: text('url'),
  description: text('description'),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
