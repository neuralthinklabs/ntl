'use server'

import { z } from 'zod'
import { and, count, eq } from 'drizzle-orm'
import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { eventRegistrations, events, eventSubmissions, eventTeamMembers, eventTeams } from '@/db/schema'
import { isUniqueViolation } from '@/lib/db-errors'
import type { ActionState } from './auth'

const uuid = z.string().uuid()
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

/** Signed-in, registered (or attended) person and a hackathon event. */
async function context(eventId: string) {
  if (!uuid.safeParse(eventId).success) return { error: 'Event not found.' } as const
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please log in.' } as const
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) })
  if (!event || event.kind !== 'hackathon') return { error: 'Event not found.' } as const
  const [reg] = await db
    .select({ status: eventRegistrations.status })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, user.id)))
  if (!reg || (reg.status !== 'registered' && reg.status !== 'attended')) {
    return { error: 'Register for the hackathon first.' } as const
  }
  return { user, event } as const
}

/** Name of the violated constraint, whether or not Drizzle wrapped the driver error. */
function constraintOf(e: unknown): string {
  const x = e as { constraint_name?: string; cause?: { constraint_name?: string } } | null
  return x?.constraint_name ?? x?.cause?.constraint_name ?? ''
}

const locked = (e: { submissionDeadline: Date | null }) => !!e.submissionDeadline && e.submissionDeadline < new Date()

function refresh(slug: string, eventId: string) {
  revalidatePath(`/events/${slug}`)
  revalidatePath(`/admin/events/${eventId}/teams`)
}

export async function createTeam(eventId: string, name: string): Promise<ActionState> {
  const c = await context(eventId)
  if ('error' in c) return { error: c.error }
  if (locked(c.event)) return { error: 'The deadline has passed, so teams are locked.' }
  const n = z.string().trim().min(2, 'Give your team a name (2+ characters).').max(60).safeParse(name)
  if (!n.success) return { error: n.error.issues[0].message }

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await db.transaction(async (tx) => {
        const [team] = await tx
          .insert(eventTeams)
          .values({ eventId, name: n.data, inviteCode: newCode(), createdBy: c.user.id })
          .returning({ id: eventTeams.id })
        await tx.insert(eventTeamMembers).values({ teamId: team.id, eventId, userId: c.user.id })
      })
      refresh(c.event.slug, eventId)
      return { success: 'Team created. Share the invite code with your teammates.' }
    } catch (e) {
      if (!isUniqueViolation(e)) throw e
      const name = constraintOf(e)
      if (name.startsWith('event_team_members')) return { error: 'You are already in a team.' }
      if (name === 'event_teams_event_name_key') return { error: 'That team name is taken. Choose another.' }
      // otherwise: invite code clash, try again with a new code
    }
  }
  return { error: 'Could not create the team. Please try again.' }
}

export async function joinTeam(eventId: string, code: string): Promise<ActionState> {
  const c = await context(eventId)
  if ('error' in c) return { error: c.error }
  if (locked(c.event)) return { error: 'The deadline has passed, so teams are locked.' }
  const invite = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(invite)) return { error: 'Enter the 6-character invite code.' }

  const team = await db.query.eventTeams.findFirst({ where: and(eq(eventTeams.inviteCode, invite), eq(eventTeams.eventId, eventId)) })
  if (!team) return { error: 'No team in this hackathon has that code.' }

  if (c.event.teamMax) {
    const [{ n }] = await db.select({ n: count() }).from(eventTeamMembers).where(eq(eventTeamMembers.teamId, team.id))
    if (n >= c.event.teamMax) return { error: `That team is full (max ${c.event.teamMax}).` }
  }
  try {
    await db.insert(eventTeamMembers).values({ teamId: team.id, eventId, userId: c.user.id })
  } catch (e) {
    if (isUniqueViolation(e)) return { error: 'You are already in a team.' }
    throw e
  }
  refresh(c.event.slug, eventId)
  return { success: `You joined ${team.name}.` }
}

export async function leaveTeam(eventId: string): Promise<ActionState> {
  const c = await context(eventId)
  if ('error' in c) return { error: c.error }
  if (locked(c.event)) return { error: 'The deadline has passed, so teams are locked.' }

  const [m] = await db
    .select({ teamId: eventTeamMembers.teamId })
    .from(eventTeamMembers)
    .where(and(eq(eventTeamMembers.eventId, eventId), eq(eventTeamMembers.userId, c.user.id)))
  if (!m) return { error: 'You are not in a team.' }

  await db.delete(eventTeamMembers).where(and(eq(eventTeamMembers.teamId, m.teamId), eq(eventTeamMembers.userId, c.user.id)))
  const [{ n }] = await db.select({ n: count() }).from(eventTeamMembers).where(eq(eventTeamMembers.teamId, m.teamId))
  if (n === 0) await db.delete(eventTeams).where(eq(eventTeams.id, m.teamId)) // submission goes with it
  refresh(c.event.slug, eventId)
  return { success: 'You left the team.' }
}

const httpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500)
    .url(`Enter a valid ${label}.`)
    .refine((u) => u.startsWith('https://'), `The ${label} must start with https://`)
    .optional()

const submissionSchema = z.object({
  eventId: uuid,
  title: z.string().trim().min(3, 'Give your project a title.').max(120),
  description: z.string().trim().min(20, 'Describe your project (at least 20 characters).').max(4000),
  repoUrl: httpsUrl('repository link'),
  demoUrl: httpsUrl('demo link'),
  videoUrl: httpsUrl('video link'),
})

/** Create or update the team's single submission (any member; until the deadline). */
export async function saveSubmission(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = submissionSchema.safeParse({
    eventId: formData.get('eventId'),
    title: formData.get('title'),
    description: formData.get('description'),
    repoUrl: formData.get('repoUrl') || undefined,
    demoUrl: formData.get('demoUrl') || undefined,
    videoUrl: formData.get('videoUrl') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const d = parsed.data

  const c = await context(d.eventId)
  if ('error' in c) return { error: c.error }
  if (locked(c.event)) return { error: 'The submission deadline has passed.' }

  const [m] = await db
    .select({ teamId: eventTeamMembers.teamId })
    .from(eventTeamMembers)
    .where(and(eq(eventTeamMembers.eventId, d.eventId), eq(eventTeamMembers.userId, c.user.id)))
  if (!m) return { error: 'Create or join a team before submitting.' }

  if (c.event.teamMin) {
    const [{ n }] = await db.select({ n: count() }).from(eventTeamMembers).where(eq(eventTeamMembers.teamId, m.teamId))
    if (n < c.event.teamMin) return { error: `Teams need at least ${c.event.teamMin} members to submit.` }
  }

  const values = {
    title: d.title,
    description: d.description,
    repoUrl: d.repoUrl ?? null,
    demoUrl: d.demoUrl ?? null,
    videoUrl: d.videoUrl ?? null,
    updatedAt: new Date(),
  }
  await db
    .insert(eventSubmissions)
    .values({ teamId: m.teamId, eventId: d.eventId, ...values })
    .onConflictDoUpdate({ target: eventSubmissions.teamId, set: values })

  refresh(c.event.slug, d.eventId)
  return { success: 'Submission saved. You can edit it until the deadline.' }
}
