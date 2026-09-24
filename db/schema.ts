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
  // Idempotency key generated client-side once per form load (P0 #5). A
  // unique constraint lets `onConflictDoNothing` silently no-op a
  // duplicate submit (double-click, retried request, etc.) instead of
  // creating a second row.
  clientRequestId: uuid('client_request_id').unique(),
  title: text('title').notNull(),
  category: text('category'),
  location: text('location'),
  description: text('description').notNull(),
  context: text('context'),
  evidenceNotes: text('evidence_notes'),
  status: problemStatusEnum('status').notNull().default('submitted'),
  // Set when one or more attachments failed to upload after the problem
  // row itself was created (P0 #3), so admins/users can see the
  // submission is incomplete rather than assuming every listed file made
  // it to storage.
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
  storagePath: text('storage_path').notNull(), // path within the `problem-attachments` bucket
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
  coverImage: text('cover_image'),
  authorId: uuid('author_id').references(() => profiles.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Contributions (money / time pledged toward a goal, recorded manually or
// via a future payments integration)
// ---------------------------------------------------------------------------

export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  goalId: uuid('goal_id').references(() => goals.id, {
    onDelete: 'set null',
  }),
  // Idempotency key generated client-side once per form mount (P0 #5) —
  // see `problems.clientRequestId` for the same pattern.
  clientRequestId: uuid('client_request_id').unique(),
  amountCents: integer('amount_cents'),
  kind: text('kind').notNull().default('donation'), // donation | time | in_kind
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
  icon: text('icon'), // lucide-react icon name
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
// Activity feed (drives the dashboard "Recent Activity" list + point log)
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
  relatedId: uuid('related_id'), // loosely-typed pointer to problem/event/goal id
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
