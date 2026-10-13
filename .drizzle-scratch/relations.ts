import { relations } from "drizzle-orm/relations";
import { problems, problemAttachments, goals, goalMilestones, profiles, goalUpdates, activityRecords, usersInAuth, contributions, stories, achievements, userAchievements, events, eventRegistrations } from "./schema";

export const problemAttachmentsRelations = relations(problemAttachments, ({one}) => ({
	problem: one(problems, {
		fields: [problemAttachments.problemId],
		references: [problems.id]
	}),
}));

export const problemsRelations = relations(problems, ({one, many}) => ({
	problemAttachments: many(problemAttachments),
	profile_reviewedBy: one(profiles, {
		fields: [problems.reviewedBy],
		references: [profiles.id],
		relationName: "problems_reviewedBy_profiles_id"
	}),
	profile_submittedBy: one(profiles, {
		fields: [problems.submittedBy],
		references: [profiles.id],
		relationName: "problems_submittedBy_profiles_id"
	}),
}));

export const goalMilestonesRelations = relations(goalMilestones, ({one}) => ({
	goal: one(goals, {
		fields: [goalMilestones.goalId],
		references: [goals.id]
	}),
}));

export const goalsRelations = relations(goals, ({many}) => ({
	goalMilestones: many(goalMilestones),
	goalUpdates: many(goalUpdates),
	contributions: many(contributions),
}));

export const goalUpdatesRelations = relations(goalUpdates, ({one}) => ({
	profile: one(profiles, {
		fields: [goalUpdates.authorId],
		references: [profiles.id]
	}),
	goal: one(goals, {
		fields: [goalUpdates.goalId],
		references: [goals.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	goalUpdates: many(goalUpdates),
	activityRecords: many(activityRecords),
	usersInAuth: one(usersInAuth, {
		fields: [profiles.id],
		references: [usersInAuth.id]
	}),
	contributions_confirmedBy: many(contributions, {
		relationName: "contributions_confirmedBy_profiles_id"
	}),
	contributions_userId: many(contributions, {
		relationName: "contributions_userId_profiles_id"
	}),
	problems_reviewedBy: many(problems, {
		relationName: "problems_reviewedBy_profiles_id"
	}),
	problems_submittedBy: many(problems, {
		relationName: "problems_submittedBy_profiles_id"
	}),
	stories: many(stories),
	userAchievements: many(userAchievements),
	eventRegistrations: many(eventRegistrations),
}));

export const activityRecordsRelations = relations(activityRecords, ({one}) => ({
	profile: one(profiles, {
		fields: [activityRecords.userId],
		references: [profiles.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	profiles: many(profiles),
}));

export const contributionsRelations = relations(contributions, ({one}) => ({
	profile_confirmedBy: one(profiles, {
		fields: [contributions.confirmedBy],
		references: [profiles.id],
		relationName: "contributions_confirmedBy_profiles_id"
	}),
	goal: one(goals, {
		fields: [contributions.goalId],
		references: [goals.id]
	}),
	profile_userId: one(profiles, {
		fields: [contributions.userId],
		references: [profiles.id],
		relationName: "contributions_userId_profiles_id"
	}),
}));

export const storiesRelations = relations(stories, ({one}) => ({
	profile: one(profiles, {
		fields: [stories.authorId],
		references: [profiles.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
	profile: one(profiles, {
		fields: [userAchievements.userId],
		references: [profiles.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({one}) => ({
	event: one(events, {
		fields: [eventRegistrations.eventId],
		references: [events.id]
	}),
	profile: one(profiles, {
		fields: [eventRegistrations.userId],
		references: [profiles.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	eventRegistrations: many(eventRegistrations),
}));