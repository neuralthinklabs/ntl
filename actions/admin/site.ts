'use server'

import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { pageControls, siteAnnouncements } from '@/db/site-schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { isValidTimeZone, zonedLocalToDate } from '@/lib/tz'
import { normalizePrefix } from '@/lib/site-constants'
import type { ActionState } from '../auth'

const uuid = z.string().uuid()

function refresh() {
  revalidatePath('/', 'layout')
  revalidatePath('/admin/site')
}

function safeLink(u: string) {
  if (u.startsWith('/')) return !u.startsWith('//') && !u.startsWith('/\\')
  try {
    return new URL(u).protocol === 'https:'
  } catch {
    return false
  }
}

/** '' -> null (not set), invalid -> undefined. */
function when(raw: FormDataEntryValue | null, tz: string): Date | null | undefined {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return null
  return zonedLocalToDate(s, tz) ?? undefined
}

// ---- Announcements ----------------------------------------------------------

const announcementSchema = z.object({
  id: uuid.optional(),
  message: z.string().trim().min(3, 'Write the announcement (3+ characters).').max(300, 'Keep it under 300 characters.'),
  linkUrl: z.string().trim().max(500).optional(),
  linkLabel: z.string().trim().max(40).optional(),
  tone: z.enum(['info', 'success', 'warning', 'urgent']),
  timezone: z.string().trim().min(1),
  countdownLabel: z.string().trim().max(60).optional(),
  countdownEndText: z.string().trim().max(120).optional(),
})

export async function saveAnnouncement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const f = (k: string) => (formData.get(k) as string) || undefined
    const p = announcementSchema.safeParse({
      id: f('id'),
      message: formData.get('message'),
      linkUrl: f('linkUrl'),
      linkLabel: f('linkLabel'),
      tone: formData.get('tone') || 'info',
      timezone: formData.get('timezone') || 'UTC',
      countdownLabel: f('countdownLabel'),
      countdownEndText: f('countdownEndText'),
    })
    if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
    const d = p.data
    if (!isValidTimeZone(d.timezone)) return { error: 'Enter a valid time zone, e.g. Asia/Kolkata or UTC.' }
    if (d.linkUrl && !safeLink(d.linkUrl)) return { error: 'The link must start with https:// or be a page on this site like /events.' }

    const startsAt = when(formData.get('startsAt'), d.timezone)
    const endsAt = when(formData.get('endsAt'), d.timezone)
    const countdownTo = when(formData.get('countdownTo'), d.timezone)
    if (startsAt === undefined || endsAt === undefined || countdownTo === undefined) return { error: 'One of the dates is not valid.' }
    if (startsAt && endsAt && endsAt <= startsAt) return { error: 'The announcement must end after it starts.' }

    const values = {
      message: d.message,
      linkUrl: d.linkUrl ?? null,
      linkLabel: d.linkUrl ? (d.linkLabel ?? null) : null,
      tone: d.tone,
      startsAt,
      endsAt,
      countdownTo,
      countdownLabel: countdownTo ? (d.countdownLabel ?? null) : null,
      countdownEndText: countdownTo ? (d.countdownEndText ?? null) : null,
      dismissible: formData.get('dismissible') === 'on',
      active: formData.get('active') === 'on',
      updatedAt: new Date(),
    }

    if (d.id) {
      await db.update(siteAnnouncements).set(values).where(eq(siteAnnouncements.id, d.id))
      await logAdmin({ actorId: admin.id, action: 'announcement_update', entity: 'announcement', entityId: d.id, summary: d.message.slice(0, 80) })
    } else {
      const [row] = await db.insert(siteAnnouncements).values({ ...values, createdBy: admin.id }).returning({ id: siteAnnouncements.id })
      await logAdmin({ actorId: admin.id, action: 'announcement_create', entity: 'announcement', entityId: row.id, summary: d.message.slice(0, 80) })
    }
    refresh()
    return { success: 'Saved.' }
  })
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const i = uuid.parse(id)
    await db.update(siteAnnouncements).set({ active, updatedAt: new Date() }).where(eq(siteAnnouncements.id, i))
    await logAdmin({ actorId: admin.id, action: active ? 'announcement_show' : 'announcement_hide', entity: 'announcement', entityId: i })
    refresh()
    return { success: active ? 'Showing.' : 'Hidden.' }
  })
}

export async function deleteAnnouncement(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const i = uuid.parse(id)
    await db.delete(siteAnnouncements).where(eq(siteAnnouncements.id, i))
    await logAdmin({ actorId: admin.id, action: 'announcement_delete', entity: 'announcement', entityId: i })
    refresh()
    return { success: 'Deleted.' }
  })
}

// ---- Page controls (block / open) ------------------------------------------

const controlSchema = z.object({
  id: uuid.optional(),
  pathPrefix: z.string(),
  title: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
  timezone: z.string().trim().min(1),
})

export async function savePageControl(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const f = (k: string) => (formData.get(k) as string) || undefined
    const p = controlSchema.safeParse({
      id: f('id'),
      pathPrefix: formData.get('pathPrefix') ?? '',
      title: f('title'),
      message: f('message'),
      timezone: formData.get('timezone') || 'UTC',
    })
    if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
    const d = p.data
    const path = normalizePrefix(d.pathPrefix)
    if (!path.ok) return { error: path.error }
    if (!isValidTimeZone(d.timezone)) return { error: 'Enter a valid time zone, e.g. Asia/Kolkata or UTC.' }

    const blocksAt = when(formData.get('blocksAt'), d.timezone)
    const opensAt = when(formData.get('opensAt'), d.timezone)
    if (blocksAt === undefined || opensAt === undefined) return { error: 'One of the dates is not valid.' }
    if (blocksAt && opensAt && opensAt <= blocksAt) return { error: 'The page must open after it is blocked.' }
    if (opensAt && opensAt <= new Date() && !blocksAt) return { error: 'The opening time is already in the past.' }
    const showCountdown = formData.get('showCountdown') === 'on'
    if (showCountdown && !opensAt) return { error: 'A countdown needs an opening time.' }

    const clash = await db.query.pageControls.findFirst({ where: eq(pageControls.pathPrefix, path.value) })
    if (clash && clash.id !== d.id) return { error: 'That page already has a rule. Edit it from the list instead.' }

    const values = {
      pathPrefix: path.value,
      enabled: true,
      title: d.title ?? null,
      message: d.message ?? null,
      blocksAt,
      opensAt,
      showCountdown,
      updatedAt: new Date(),
    }
    if (d.id) {
      await db.update(pageControls).set(values).where(eq(pageControls.id, d.id))
      await logAdmin({ actorId: admin.id, action: 'page_control_update', entity: 'page_control', entityId: d.id, summary: path.value })
    } else {
      const [row] = await db.insert(pageControls).values({ ...values, createdBy: admin.id }).returning({ id: pageControls.id })
      await logAdmin({ actorId: admin.id, action: 'page_control_create', entity: 'page_control', entityId: row.id, summary: path.value })
    }
    refresh()
    return { success: 'Saved. The rule is on.' }
  })
}

/** enabled=false opens the page. enabled=true blocks it again from now (an opening time already in the past is cleared). */
export async function setPageControlEnabled(id: string, enabled: boolean): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const i = uuid.parse(id)
    const row = await db.query.pageControls.findFirst({ where: eq(pageControls.id, i) })
    if (!row) return { error: 'That rule no longer exists.' }
    const now = new Date()
    await db
      .update(pageControls)
      .set(
        enabled
          ? { enabled: true, blocksAt: null, opensAt: row.opensAt && row.opensAt <= now ? null : row.opensAt, showCountdown: row.opensAt && row.opensAt <= now ? false : row.showCountdown, updatedAt: now }
          : { enabled: false, updatedAt: now },
      )
      .where(eq(pageControls.id, i))
    await logAdmin({ actorId: admin.id, action: enabled ? 'page_block' : 'page_open', entity: 'page_control', entityId: i, summary: row.pathPrefix })
    refresh()
    return { success: enabled ? 'Blocked.' : 'Page is open.' }
  })
}

export async function deletePageControl(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const i = uuid.parse(id)
    const row = await db.query.pageControls.findFirst({ where: eq(pageControls.id, i) })
    await db.delete(pageControls).where(eq(pageControls.id, i))
    await logAdmin({ actorId: admin.id, action: 'page_control_delete', entity: 'page_control', entityId: i, summary: row?.pathPrefix })
    refresh()
    return { success: 'Rule deleted. The page is open.' }
  })
}
