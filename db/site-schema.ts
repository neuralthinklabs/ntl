import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { profiles } from './schema'

// Migration 0023. Own file, like community-schema.ts.

export const siteAnnouncements = pgTable('site_announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  message: text('message').notNull(),
  linkUrl: text('link_url'),
  linkLabel: text('link_label'),
  tone: text('tone', { enum: ['info', 'success', 'warning', 'urgent'] }).notNull().default('info'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  countdownTo: timestamp('countdown_to', { withTimezone: true }),
  countdownLabel: text('countdown_label'),
  countdownEndText: text('countdown_end_text'),
  dismissible: boolean('dismissible').notNull().default(true),
  active: boolean('active').notNull().default(true),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pageControls = pgTable('page_controls', {
  id: uuid('id').primaryKey().defaultRandom(),
  pathPrefix: text('path_prefix').notNull().unique(),
  enabled: boolean('enabled').notNull().default(true),
  title: text('title'),
  message: text('message'),
  blocksAt: timestamp('blocks_at', { withTimezone: true }),
  opensAt: timestamp('opens_at', { withTimezone: true }),
  showCountdown: boolean('show_countdown').notNull().default(false),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
