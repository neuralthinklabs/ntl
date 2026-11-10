'use server'

import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { communityEmailPrefs } from '@/db/collab-schema'
import { getViewer } from '@/lib/community/authz'
import { DIGEST_OPTIONS } from '@/lib/collab/constants'
import type { ActionState } from './auth'

/** Opt-in email digest. Turning it on starts the clock now, so no old notifications are mailed. */
export async function setDigestPreference(value: string): Promise<ActionState> {
  const v = z.enum(DIGEST_OPTIONS).safeParse(value)
  if (!v.success) return { error: 'Choose one of the options.' }
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  await db
    .insert(communityEmailPrefs)
    .values({ userId: viewer.id, digest: v.data })
    .onConflictDoUpdate({
      target: communityEmailPrefs.userId,
      set: {
        digest: v.data,
        lastDigestAt: sql`case when ${communityEmailPrefs.digest} = 'off' then now() else ${communityEmailPrefs.lastDigestAt} end`,
        updatedAt: new Date(),
      },
    })
  revalidatePath('/community/settings')
  return { success: v.data === 'off' ? 'Email digest turned off.' : 'Saved. Your first digest arrives after the next scheduled run.' }
}
