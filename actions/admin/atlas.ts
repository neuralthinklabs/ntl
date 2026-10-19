'use server'

import { z } from 'zod'
import { and, count, eq, ne } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { atlasUnits } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { ATLAS_LEVELS, PARENT_LEVEL } from '@/lib/atlas-constants'
import type { ActionState } from '../auth'

const lines = (s?: string) => (s ?? '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 50)

const schema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, 'Code: 2-20 letters, numbers or dashes, e.g. Z01-S02.'),
  name: z.string().trim().min(2, 'Enter a name.').max(160),
  level: z.enum(ATLAS_LEVELS as unknown as [string, ...string[]]),
  parentId: z.string().uuid().optional(),
  summary: z.string().trim().max(3000).optional(),
  demographics: z.string().trim().max(5000).optional(),
  problemDomains: z.string().max(3000).optional(),
  resources: z.string().max(3000).optional(),
  initiatives: z.string().trim().max(5000).optional(),
  dataSources: z.string().trim().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000),
})

function refresh(code?: string) {
  revalidatePath('/')
  revalidatePath('/atlas')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/atlas')
  if (code) revalidatePath(`/atlas/${code}`)
}

export async function saveAtlasUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const opt = (k: string) => (formData.get(k) as string) || undefined
    const parsed = schema.safeParse({
      id: opt('id'), code: formData.get('code'), name: formData.get('name'), level: formData.get('level'),
      parentId: opt('parentId'), summary: opt('summary'), demographics: opt('demographics'),
      problemDomains: opt('problemDomains'), resources: opt('resources'), initiatives: opt('initiatives'),
      dataSources: opt('dataSources'), sortOrder: formData.get('sortOrder') || 0,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data
    const level = d.level as (typeof ATLAS_LEVELS)[number]

    // Hierarchy: zone has no parent; subzone sits in a zone; cluster sits in a subzone.
    const need = PARENT_LEVEL[level]
    if (!need && d.parentId) return { error: 'A zone cannot have a parent.' }
    if (need) {
      if (!d.parentId) return { error: `Choose the parent ${need}.` }
      const parent = await db.query.atlasUnits.findFirst({ where: eq(atlasUnits.id, d.parentId) })
      if (!parent || parent.level !== need) return { error: `The parent of a ${level} must be a ${need}.` }
    }

    const clash = await db.query.atlasUnits.findFirst({
      where: d.id ? and(eq(atlasUnits.code, d.code), ne(atlasUnits.id, d.id)) : eq(atlasUnits.code, d.code),
    })
    if (clash) return { error: 'That code is already in use.' }

    if (d.id) {
      const prev = await db.query.atlasUnits.findFirst({ where: eq(atlasUnits.id, d.id) })
      if (!prev) return { error: 'This item no longer exists.' }
      if (prev.level !== level) {
        const [{ n }] = await db.select({ n: count() }).from(atlasUnits).where(eq(atlasUnits.parentId, d.id))
        if (n > 0) return { error: 'Move or delete its children before changing the level.' }
      }
    }

    const values = {
      code: d.code, name: d.name, level, parentId: need ? d.parentId! : null,
      summary: d.summary ?? null, demographics: d.demographics ?? null,
      problemDomains: lines(d.problemDomains), resources: lines(d.resources),
      initiatives: d.initiatives ?? null, dataSources: d.dataSources ?? null,
      verified: formData.get('verified') === 'on', published: formData.get('published') === 'on',
      sortOrder: d.sortOrder, lastUpdated: new Date(),
    }

    if (d.id) {
      await db.update(atlasUnits).set(values).where(eq(atlasUnits.id, d.id))
      await logAdmin({ actorId: admin.id, action: 'atlas_update', entity: 'atlas', entityId: d.id, summary: d.code })
      refresh(d.code)
      return { success: 'Saved.' }
    }
    const [row] = await db.insert(atlasUnits).values(values).returning({ id: atlasUnits.id })
    await logAdmin({ actorId: admin.id, action: 'atlas_create', entity: 'atlas', entityId: row.id, summary: d.code })
    refresh(d.code)
    redirect(`/admin/atlas/${row.id}?created=1`)
  })
}

export async function deleteAtlasUnit(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const uid = z.string().uuid().parse(id)
    const [{ n }] = await db.select({ n: count() }).from(atlasUnits).where(eq(atlasUnits.parentId, uid))
    if (n > 0) return { error: 'Delete or move its children first.' }
    const row = await db.query.atlasUnits.findFirst({ where: eq(atlasUnits.id, uid) })
    await db.delete(atlasUnits).where(eq(atlasUnits.id, uid))
    await logAdmin({ actorId: admin.id, action: 'atlas_delete', entity: 'atlas', entityId: uid, summary: row?.code })
    refresh(row?.code)
    redirect('/admin/atlas')
  })
}
