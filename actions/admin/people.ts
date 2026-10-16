'use server'

import { asc, ilike, or } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { requireAdminAction } from '@/lib/auth/admin'

export type PersonHit = {
  id: string
  name: string
  email: string
  ntlId: string
  showCredit: boolean
}

/** Admin-only people search by name, NTL ID or email (for the "tag a person" picker). */
export async function searchPeople(query: string): Promise<PersonHit[]> {
  try {
    await requireAdminAction()
  } catch {
    return []
  }
  const term = String(query ?? '').trim().slice(0, 60)
  if (term.length < 2) return []

  // Escape LIKE wildcards so "%" or "_" typed by the admin match literally.
  const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`

  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.fullName,
      email: profiles.email,
      ntlId: profiles.ntlId,
      showCredit: profiles.showCredit,
    })
    .from(profiles)
    .where(or(ilike(profiles.fullName, like), ilike(profiles.ntlId, like), ilike(profiles.email, like)))
    .orderBy(asc(profiles.fullName))
    .limit(8)

  return rows.map((r) => ({ ...r, name: r.name || r.email }))
}
