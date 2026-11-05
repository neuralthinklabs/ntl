import { pgTable, pgEnum, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { stories } from './schema'

// Migration 0018. Kept in its own file so db/schema.ts needs no edits.
// Queries use db.select()...; there are no relational-query entries for these.

export const collectionKindEnum = pgEnum('collection_kind', ['series', 'magazine'])

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  kind: collectionKindEnum('kind').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const collectionStories = pgTable('collection_stories', {
  storyId: uuid('story_id')
    .primaryKey()
    .references(() => stories.id, { onDelete: 'cascade' }),
  collectionId: uuid('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  issue: integer('issue'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
