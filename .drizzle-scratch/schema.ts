import { pgTable, index, foreignKey, pgPolicy, uuid, text, integer, timestamp, unique, jsonb, boolean, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const activityType = pgEnum("activity_type", ['problem_submitted', 'event_registered', 'event_attended', 'contribution_made', 'achievement_earned', 'goal_supported'])
export const contributionStatus = pgEnum("contribution_status", ['pledged', 'confirmed', 'rejected', 'refunded'])
export const goalStatus = pgEnum("goal_status", ['planned', 'in_progress', 'completed'])
export const milestoneStatus = pgEnum("milestone_status", ['upcoming', 'in_progress', 'completed'])
export const portfolioStatus = pgEnum("portfolio_status", ['Active', 'In Progress', 'Planned', 'Completed'])
export const portfolioType = pgEnum("portfolio_type", ['Product', 'Service', 'Venture', 'System', 'Publication'])
export const problemStatus = pgEnum("problem_status", ['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'declined'])
export const registrationStatus = pgEnum("registration_status", ['registered', 'waitlisted', 'cancelled', 'attended'])
export const userRole = pgEnum("user_role", ['member', 'admin'])


export const problemAttachments = pgTable("problem_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	problemId: uuid("problem_id").notNull(),
	storagePath: text("storage_path").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type"),
	fileSize: integer("file_size"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("problem_attachments_problem_id_idx").using("btree", table.problemId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.problemId],
			foreignColumns: [problems.id],
			name: "problem_attachments_problem_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Admins can view all attachments", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))` }),
	pgPolicy("Users can view attachments on their problems", { as: "permissive", for: "select", to: ["public"] }),
]);

export const goalMilestones = pgTable("goal_milestones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	goalId: uuid("goal_id").notNull(),
	name: text().notNull(),
	status: milestoneStatus().default('upcoming').notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.goalId],
			foreignColumns: [goals.id],
			name: "goal_milestones_goal_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Goal milestones are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const goalUpdates = pgTable("goal_updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	goalId: uuid("goal_id").notNull(),
	authorId: uuid("author_id"),
	title: text().notNull(),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "goal_updates_author_id_fkey"
		}),
	foreignKey({
			columns: [table.goalId],
			foreignColumns: [goals.id],
			name: "goal_updates_goal_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Goal updates are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const achievements = pgTable("achievements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text(),
	icon: text(),
	pointsAwarded: integer("points_awarded").default(0).notNull(),
}, (table) => [
	unique("achievements_slug_key").on(table.slug),
	pgPolicy("Achievements are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const activityRecords = pgTable("activity_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: activityType().notNull(),
	title: text().notNull(),
	meta: text(),
	pointsDelta: integer("points_delta").default(0).notNull(),
	relatedId: uuid("related_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activity_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "activity_records_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view their own activity", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);

export const contactEnquiries = pgTable("contact_enquiries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	message: text().notNull(),
	handled: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("contact_enquiries_handled_idx").using("btree", table.handled.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	bio: text(),
	role: userRole().default('member').notNull(),
	points: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update their own profile", { as: "permissive", for: "update", to: ["public"], using: sql`(auth.uid() = id)`, withCheck: sql`(auth.uid() = id)`  }),
	pgPolicy("Admins can read all profiles", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can read their own profile", { as: "permissive", for: "select", to: ["public"] }),
]);

export const portfolioItems = pgTable("portfolio_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	type: portfolioType().notNull(),
	status: portfolioStatus().default('Planned').notNull(),
	description: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("Portfolio items are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const authAttempts = pgTable("auth_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	identifier: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("auth_attempts_identifier_created_at_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
]);

export const contributions = pgTable("contributions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	goalId: uuid("goal_id"),
	amountCents: integer("amount_cents"),
	kind: text().default('donation').notNull(),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	clientRequestId: uuid("client_request_id"),
	status: contributionStatus().default('pledged').notNull(),
	paymentRef: text("payment_ref"),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	confirmedBy: uuid("confirmed_by"),
}, (table) => [
	index("contributions_goal_id_idx").using("btree", table.goalId.asc().nullsLast().op("uuid_ops")),
	index("contributions_status_idx").using("btree", table.status.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("enum_ops")),
	index("contributions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.confirmedBy],
			foreignColumns: [profiles.id],
			name: "contributions_confirmed_by_fkey"
		}),
	foreignKey({
			columns: [table.goalId],
			foreignColumns: [goals.id],
			name: "contributions_goal_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "contributions_user_id_fkey"
		}).onDelete("cascade"),
	unique("contributions_client_request_id_key").on(table.clientRequestId),
	pgPolicy("Users can view their own contributions", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);

export const problems = pgTable("problems", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submittedBy: uuid("submitted_by").notNull(),
	title: text().notNull(),
	category: text(),
	location: text(),
	description: text().notNull(),
	context: text(),
	evidenceNotes: text("evidence_notes"),
	status: problemStatus().default('submitted').notNull(),
	adminNotes: text("admin_notes"),
	reviewedBy: uuid("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	clientRequestId: uuid("client_request_id"),
	attachmentsIncomplete: boolean("attachments_incomplete").default(false).notNull(),
	ntldgSlug: text("ntldg_slug"),
}, (table) => [
	index("problems_attachments_incomplete_idx").using("btree", table.attachmentsIncomplete.asc().nullsLast().op("bool_ops")).where(sql`(attachments_incomplete = true)`),
	index("problems_ntldg_idx").using("btree", table.ntldgSlug.asc().nullsLast().op("text_ops")),
	index("problems_submitted_by_idx").using("btree", table.submittedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [profiles.id],
			name: "problems_reviewed_by_fkey"
		}),
	foreignKey({
			columns: [table.submittedBy],
			foreignColumns: [profiles.id],
			name: "problems_submitted_by_fkey"
		}).onDelete("cascade"),
	unique("problems_client_request_id_key").on(table.clientRequestId),
	pgPolicy("Admins can update problems", { as: "permissive", for: "update", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))` }),
	pgPolicy("Admins can view all problems", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can view their own problems", { as: "permissive", for: "select", to: ["public"] }),
]);

export const goals = pgTable("goals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	problemSummary: text("problem_summary"),
	objective: text(),
	responsibleTeam: text("responsible_team"),
	status: goalStatus().default('planned').notNull(),
	fundingTargetCents: integer("funding_target_cents").default(0).notNull(),
	fundingRaisedCents: integer("funding_raised_cents").default(0).notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	heroImage: text("hero_image"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ntldgSlug: text("ntldg_slug"),
}, (table) => [
	unique("goals_slug_key").on(table.slug),
	pgPolicy("Goals are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const stories = pgTable("stories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	excerpt: text(),
	body: text(),
	coverImage: text("cover_image"),
	authorId: uuid("author_id"),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	category: text(),
	ntldgSlug: text("ntldg_slug"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("stories_published_idx").using("btree", table.publishedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "stories_author_id_fkey"
		}),
	unique("stories_slug_key").on(table.slug),
	pgPolicy("Stories are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text(),
	location: text(),
	isOnline: boolean("is_online").default(false).notNull(),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }).notNull(),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	capacity: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	timezone: text().default('UTC').notNull(),
}, (table) => [
	unique("events_slug_key").on(table.slug),
	pgPolicy("Events are publicly readable", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const userAchievements = pgTable("user_achievements", {
	userId: uuid("user_id").notNull(),
	achievementId: uuid("achievement_id").notNull(),
	earnedAt: timestamp("earned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "user_achievements_achievement_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_achievements_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.achievementId], name: "user_achievements_pkey"}),
	pgPolicy("Users can view their own achievements", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);

export const eventRegistrations = pgTable("event_registrations", {
	eventId: uuid("event_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: registrationStatus().default('registered').notNull(),
	registeredAt: timestamp("registered_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_registrations_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "event_registrations_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.eventId, table.userId], name: "event_registrations_pkey"}),
	pgPolicy("Users can view their own registrations", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);
