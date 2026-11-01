import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { eventSubmissions, eventTeamMembers, eventTeams, profiles } from '@/db/schema'

export type MyTeam = {
  id: string
  name: string
  inviteCode: string
  members: { name: string }[]
  submission: { title: string; description: string; repoUrl: string; demoUrl: string; videoUrl: string } | null
}

/** The person's team for this hackathon, with member names (never emails). */
export async function getMyTeam(eventId: string, userId: string): Promise<MyTeam | null> {
  const [m] = await db
    .select({ team: eventTeams })
    .from(eventTeamMembers)
    .innerJoin(eventTeams, eq(eventTeamMembers.teamId, eventTeams.id))
    .where(and(eq(eventTeamMembers.eventId, eventId), eq(eventTeamMembers.userId, userId)))
  if (!m) return null

  const [members, sub] = await Promise.all([
    db
      .select({ name: profiles.fullName, ntlId: profiles.ntlId })
      .from(eventTeamMembers)
      .innerJoin(profiles, eq(eventTeamMembers.userId, profiles.id))
      .where(eq(eventTeamMembers.teamId, m.team.id))
      .orderBy(asc(eventTeamMembers.joinedAt)),
    db.query.eventSubmissions.findFirst({ where: eq(eventSubmissions.teamId, m.team.id) }),
  ])
  return {
    id: m.team.id,
    name: m.team.name,
    inviteCode: m.team.inviteCode,
    members: members.map((x) => ({ name: x.name || x.ntlId })),
    submission: sub
      ? { title: sub.title, description: sub.description, repoUrl: sub.repoUrl ?? '', demoUrl: sub.demoUrl ?? '', videoUrl: sub.videoUrl ?? '' }
      : null,
  }
}
