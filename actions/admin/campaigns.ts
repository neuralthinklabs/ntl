'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { goals, goalMilestones, goalUpdates } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { slugify } from '@/lib/slug'
import { goalIndexBySlug } from '@/lib/ntldgs'
import type { ActionState } from '../auth'

const MAX_CENTS = 2_000_000_000 // Postgres integer ceiling is ~2.147B

const dollars = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .min(0, `${label} cannot be negative.`)
    .max(MAX_CENTS / 100, `${label} is too large.`)

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  slug: z.string().trim().max(80).optional(),
  ntldgSlug: z.string().optional(),
  problemSummary: z.string().trim().max(3000).optional(),
  objective: z.string().trim().max(3000).optional(),
  responsibleTeam: z.string().trim().max(200).optional(),
  status: z.enum(['planned', 'in_progress', 'completed']),
  target: dollars('Funding target'),
  raised: dollars('Raised so far'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  heroImage: z.string().trim().url().optional().or(z.literal('')),
})

function refresh(slug?: string) {
  revalidatePath('/')
  revalidatePath('/support')
  revalidatePath('/admin/campaigns')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath(`/goals/${slug}`)
}

const toDate = (s?: string) => (s ? new Date(`${s}T00:00:00Z`) : null)

export async function saveCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    const parsed = campaignSchema.safeParse({
      id: formData.get('id') || undefined,
      title: formData.get('title'),
      slug: formData.get('slug') || undefined,
      ntldgSlug: formData.get('ntldgSlug') || undefined,
      problemSummary: formData.get('problemSummary') || undefined,
      objective: formData.get('objective') || undefined,
      responsibleTeam: formData.get('responsibleTeam') || undefined,
      status: formData.get('status'),
      target: formData.get('target') || 0,
      raised: formData.get('raised') || 0,
      startDate: formData.get('startDate') || undefined,
      endDate: formData.get('endDate') || undefined,
      heroImage: formData.get('heroImage') || '',
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    const slug = slugify(d.slug || d.title)
    if (!slug) return { error: 'Add a title or slug with letters or numbers.' }

    const values = {
      slug,
      title: d.title,
      ntldgSlug: d.ntldgSlug && goalIndexBySlug(d.ntldgSlug) >= 0 ? d.ntldgSlug : null,
      problemSummary: d.problemSummary ?? null,
      objective: d.objective ?? null,
      responsibleTeam: d.responsibleTeam ?? null,
      status: d.status,
      fundingTargetCents: Math.round(d.target * 100),
      fundingRaisedCents: Math.round(d.raised * 100),
      startDate: toDate(d.startDate),
      endDate: toDate(d.endDate),
      heroImage: d.heroImage || null,
      updatedAt: new Date(),
    }

    if (d.id) {
      const prev = await db.query.goals.findFirst({ where: eq(goals.id, d.id) })
      await db.update(goals).set(values).where(eq(goals.id, d.id))
      refresh(prev?.slug)
      refresh(slug)
      revalidatePath(`/admin/campaigns/${d.id}`)
      return { success: 'Saved.' }
    }
    const [row] = await db.insert(goals).values(values).returning({ id: goals.id })
    refresh(slug)
    redirect(`/admin/campaigns/${row.id}?created=1`)
  })
}

export async function deleteCampaign(id: string): Promise<ActionState> {
  return runAdmin(async () => {
    const row = await db.query.goals.findFirst({ where: eq(goals.id, id) })
    await db.delete(goals).where(eq(goals.id, id))
    refresh(row?.slug)
    redirect('/admin/campaigns')
  })
}

// ---- Milestones ------------------------------------------------------------

const milestoneStatus = z.enum(['upcoming', 'in_progress', 'completed'])

export async function addMilestone(goalId: string, name: string): Promise<ActionState> {
  return runAdmin(async () => {
    const n = z.string().trim().min(2, 'Name the milestone.').max(200).safeParse(name)
    if (!n.success) return { error: n.error.issues[0].message }
    const existing = await db.query.goalMilestones.findMany({ where: eq(goalMilestones.goalId, goalId) })
    await db.insert(goalMilestones).values({
      goalId,
      name: n.data,
      sortOrder: existing.reduce((m, x) => Math.max(m, x.sortOrder), 0) + 1,
    })
    await revalidateGoal(goalId)
    return { success: 'Milestone added.' }
  })
}

export async function setMilestoneStatus(
  id: string,
  goalId: string,
  status: z.infer<typeof milestoneStatus>,
): Promise<ActionState> {
  return runAdmin(async () => {
    const s = milestoneStatus.parse(status)
    await db
      .update(goalMilestones)
      .set({ status: s, completedAt: s === 'completed' ? new Date() : null })
      .where(eq(goalMilestones.id, id))
    await revalidateGoal(goalId)
    return { success: 'Updated.' }
  })
}

export async function deleteMilestone(id: string, goalId: string): Promise<ActionState> {
  return runAdmin(async () => {
    await db.delete(goalMilestones).where(eq(goalMilestones.id, id))
    await revalidateGoal(goalId)
    return { success: 'Removed.' }
  })
}

// ---- Updates ---------------------------------------------------------------

export async function postGoalUpdate(goalId: string, title: string, body: string): Promise<ActionState> {
  return runAdmin(async (user) => {
    const p = z
      .object({ title: z.string().trim().min(3, 'Add a title.').max(200), body: z.string().trim().min(5, 'Write the update.').max(5000) })
      .safeParse({ title, body })
    if (!p.success) return { error: p.error.issues[0].message }
    await db.insert(goalUpdates).values({ goalId, authorId: user.id, title: p.data.title, body: p.data.body })
    await revalidateGoal(goalId)
    return { success: 'Update posted.' }
  })
}

export async function deleteGoalUpdate(id: string, goalId: string): Promise<ActionState> {
  return runAdmin(async () => {
    await db.delete(goalUpdates).where(eq(goalUpdates.id, id))
    await revalidateGoal(goalId)
    return { success: 'Removed.' }
  })
}

async function revalidateGoal(goalId: string) {
  const g = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (g) revalidatePath(`/goals/${g.slug}`)
  revalidatePath(`/admin/campaigns/${goalId}`)
}
