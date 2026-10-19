import { and, asc, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { atlasUnits } from '@/db/schema'
import type { AtlasLevel } from './atlas-constants'

export * from './atlas-constants'
export type AtlasUnit = typeof atlasUnits.$inferSelect

const published = eq(atlasUnits.published, true)

export async function getAtlasCounts(): Promise<Record<AtlasLevel, number>> {
  const out: Record<AtlasLevel, number> = { zone: 0, subzone: 0, cluster: 0 }
  try {
    const rows = await db
      .select({ level: atlasUnits.level, n: count() })
      .from(atlasUnits)
      .where(published)
      .groupBy(atlasUnits.level)
    for (const r of rows) out[r.level] = r.n
  } catch {
    // Table not migrated yet: show zeros rather than break the homepage.
  }
  return out
}

/** All published units. Fine for hundreds of rows; revisit with pagination if it grows far past that. */
export async function getAllUnits() {
  return db.query.atlasUnits.findMany({
    where: published,
    orderBy: [asc(atlasUnits.sortOrder), asc(atlasUnits.code)],
  })
}

export async function getUnitByCode(code: string) {
  const clean = code.trim().toUpperCase()
  if (!/^[A-Z0-9-]{2,20}$/.test(clean)) return null
  return (await db.query.atlasUnits.findFirst({ where: and(eq(atlasUnits.code, clean), published) })) ?? null
}

export async function getChildren(parentId: string) {
  return db.query.atlasUnits.findMany({
    where: and(eq(atlasUnits.parentId, parentId), published),
    orderBy: [asc(atlasUnits.sortOrder), asc(atlasUnits.code)],
  })
}

/** Ancestors, root first (zone, then subzone). */
export async function getTrail(unit: AtlasUnit) {
  const trail: AtlasUnit[] = []
  let cur: AtlasUnit | null = unit
  for (let i = 0; i < 3 && cur?.parentId; i++) {
    const parent: AtlasUnit | undefined = await db.query.atlasUnits.findFirst({
      where: and(eq(atlasUnits.id, cur.parentId), published),
    })
    if (!parent) break
    trail.unshift(parent)
    cur = parent
  }
  return trail
}

export async function getAtlasCodes() {
  try {
    return await db.select({ code: atlasUnits.code, updatedAt: atlasUnits.lastUpdated }).from(atlasUnits).where(published)
  } catch {
    return []
  }
}
