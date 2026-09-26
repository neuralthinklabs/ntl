import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum('user_role', ['member', 'admin'])

export const problemStatusEnum = pgEnum('problem_status', [
  'submitted',
  'in_review',
  'accepted',
  'in_progress',
  'resolved',
  'declined',
])

export const goalStatusEnum = pgEnum('goal_status', [
  'planned',
  'in_progress',
  'completed',
])

export const milestoneStatusEnum = pgEnum('milestone_status', [
  'upcoming',
  'in_progress',
  'completed',
])

export const registrationStatusEnum = pgEnum('registration_status', [
  'registered',
  'waitlisted',
  'cancelled',
  'attended',
])

export const activityTypeEnum = pgEnum('activity_type', [
  'problem_submitted',
  'event_registered',
  'event_attended',
  'contribution_made',
  'achievement_earned',
  'goal_supported',
])

// P2 #15 follow-up: portfolio.ts / /portfolio previously stayed on
// lib/data.ts mock data even after goals, events, and stories moved to
// real tables. These two enums + the portfolioItems table below bring it
// in line with that same pattern — see lib/portfolio.ts.
export const portfolioTypeEnum = pgEnum('portfolio_type', [
  'Product',
  'Service',
  'Venture',
  'System',
  'Publication',
])

export const portfolioStatusEnum = pgEnum('portfolio_status', [
  'Active',
  'In Progress',
  'Planned',
  'Completed',
])

// ---------------------------------------------------------------------------
// Users & profiles
// profiles.id === Supabase auth.users.id (the source of truth for auth lives
// in Supabase Auth; this table holds the app-facing profile + role).
// ---------------------------------------------------------------------------

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: userRoleEnum('role').notNull().default('member'),
  points: integer('points').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  submittedBy: uuid('submitted_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  clientRequestId: uuid('client_request_id').unique(),
  title: text('title').notNull(),
  category: text('category'),
  location: text('location'),
  description: text('description').notNull(),
  context: text('context'),
  evidenceNotes: text('evidence_notes'),
  status: problemStatusEnum('status').notNull().default('submitted'),
  attachmentsIncomplete: boolean('attachments_incomplete')
    .notNull()
    .default(false),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const problemAttachments = pgTable('problem_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => problems.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  problemSummary: text('problem_summary'),
  objective: text('objective'),
  responsibleTeam: text('responsible_team'),
  status: goalStatusEnum('status').notNull().default('planned'),
  fundingTargetCents: integer('funding_target_cents').notNull().default(0),
  fundingRaisedCents: integer('funding_raised_cents').notNull().default(0),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  heroImage: text('hero_image'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const goalMilestones = pgTable('goal_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: milestoneStatusEnum('status').notNull().default('upcoming'),
  sortOrder: integer('sort_order').notNull().default(0),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const goalUpdates = pgTable('goal_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => profiles.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  isOnline: boolean('is_online').notNull().default(false),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  capacity: integer('capacity'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const eventRegistrations = pgTable(
  'event_registrations',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: registrationStatusEnum('status').notNull().default('registered'),
    registeredAt: timestamp('registered_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.eventId, t.userId] }),
  }),
)

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  body: text('body'),
  // P2 #15: added so /stories can drive the existing category filter pills
  // (Project Stories / Research / News / Education) from real data instead
  // of hardcoding "News" for every row. See supabase/migrations/0003_p1_fixes.sql.
  category: text('category'),
  coverImage: text('cover_image'),
  authorId: uuid('author_id').references(() => profiles.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export const portfolioItems = pgTable('portfolio_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: portfolioTypeEnum('type').notNull(),
  status: portfolioStatusEnum('status').notNull().default('Planned'),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Contributions
// ---------------------------------------------------------------------------

export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  goalId: uuid('goal_id').references(() => goals.id, {
    onDelete: 'set null',
  }),
  clientRequestId: uuid('client_request_id').unique(),
  amountCents: integer('amount_cents'),
  kind: text('kind').notNull().default('donation'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  pointsAwarded: integer('points_awarded').notNull().default(0),
})

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.achievementId] }),
  }),
)

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export const activityRecords = pgTable('activity_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  type: activityTypeEnum('type').notNull(),
  title: text('title').notNull(),
  meta: text('meta'),
  pointsDelta: integer('points_delta').notNull().default(0),
  relatedId: uuid('related_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Contact enquiries
// ---------------------------------------------------------------------------

export const contactEnquiries = pgTable('contact_enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  handled: boolean('handled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// P1 #6: auth rate limiting. A row per attempt (signup / login /
// reset-password / resend-verification); `lib/rate-limit.ts` counts rows
// within a trailing window per identifier ("<ip>:<email>") and opportunistically
// deletes old rows. Indexed on (identifier, createdAt) since every query
// filters on both.
// ---------------------------------------------------------------------------

export const authAttempts = pgTable(
  'auth_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    identifierCreatedAtIdx: index('auth_attempts_identifier_created_at_idx').on(
      t.identifier,
      t.createdAt,
    ),
  }),
)

// ---------------------------------------------------------------------------
// Relations (used for Drizzle's relational query API)
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ many }) => ({
  problems: many(problems),
  activity: many(activityRecords),
  contributions: many(contributions),
  achievements: many(userAchievements),
  eventRegistrations: many(eventRegistrations),
}))

export const problemsRelations = relations(problems, ({ one, many }) => ({
  submitter: one(profiles, {
    fields: [problems.submittedBy],
    references: [profiles.id],
  }),
  attachments: many(problemAttachments),
}))

export const problemAttachmentsRelations = relations(
  problemAttachments,
  ({ one }) => ({
    problem: one(problems, {
      fields: [problemAttachments.problemId],
      references: [problems.id],
    }),
  }),
)

export const goalsRelations = relations(goals, ({ many }) => ({
  milestones: many(goalMilestones),
  updates: many(goalUpdates),
  contributions: many(contributions),
}))

export const goalMilestonesRelations = relations(
  goalMilestones,
  ({ one }) => ({
    goal: one(goals, { fields: [goalMilestones.goalId], references: [goals.id] }),
  }),
)

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
}))

export const eventRegistrationsRelations = relations(
  eventRegistrations,
  ({ one }) => ({
    event: one(events, {
      fields: [eventRegistrations.eventId],
      references: [events.id],
    }),
    user: one(profiles, {
      fields: [eventRegistrations.userId],
      references: [profiles.id],
    }),
  }),
)

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(profiles, {
      fields: [userAchievements.userId],
      references: [profiles.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
)
