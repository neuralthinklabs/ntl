import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { pageControls, siteAnnouncements } from '@/db/site-schema'
import { isNeverBlocked, pathMatches } from './site-constants'

export type PageBlock = { pathPrefix: string; title: string; message: string; opensAt: string | null; showCountdown: boolean }

export type AnnouncementData = {
  id: string
  message: string
  linkUrl: string | null
  linkLabel: string | null
  tone: 'info' | 'success' | 'warning' | 'urgent'
  countdownTo: string | null
  countdownLabel: string | null
  countdownEndText: string | null
  dismissible: boolean
  /** Changes whenever an admin edits it, so a dismissed banner comes back when it is updated. */
  version: number
}

export function isBlockedNow(r: { enabled: boolean; blocksAt: Date | null; opensAt: Date | null }, now = new Date()) {
  return r.enabled && (!r.blocksAt || r.blocksAt <= now) && (!r.opensAt || r.opensAt > now)
}

// One small query per request (React cache). The tables are tiny; if migration
// 0023 has not run yet we fail open rather than break the site.
const enabledControls = cache(async () => {
  try {
    return await db.select().from(pageControls).where(eq(pageControls.enabled, true))
  } catch (err) {
    console.error('[site-controls] could not read page_controls:', err)
    return []
  }
})

const rank = (p: string) => (p === '*' ? 0 : p.length)

export async function getBlockForPath(path: string): Promise<PageBlock | null> {
  if (!path || isNeverBlocked(path)) return null
  const now = new Date()
  const hits = (await enabledControls())
    .filter((r) => isBlockedNow(r, now) && pathMatches(path, r.pathPrefix))
    .sort((a, b) => rank(b.pathPrefix) - rank(a.pathPrefix))
  const r = hits[0]
  if (!r) return null
  return {
    pathPrefix: r.pathPrefix,
    title: r.title || 'Temporarily unavailable',
    message: r.message || 'This page is temporarily unavailable. Please check back soon.',
    opensAt: r.opensAt ? r.opensAt.toISOString() : null,
    showCountdown: r.showCountdown && !!r.opensAt,
  }
}

/** For server actions: returns the block message if any of these paths is currently blocked. */
export async function actionBlockedMessage(...paths: string[]): Promise<string | null> {
  for (const p of paths) {
    const b = await getBlockForPath(p)
    if (b) return b.message
  }
  return null
}

export const getLiveAnnouncements = cache(async (): Promise<AnnouncementData[]> => {
  try {
    const now = new Date()
    const rows = await db.select().from(siteAnnouncements).where(eq(siteAnnouncements.active, true))
    return rows
      .filter((a) => (!a.startsAt || a.startsAt <= now) && (!a.endsAt || a.endsAt > now))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3)
      .map((a) => ({
        id: a.id,
        message: a.message,
        linkUrl: a.linkUrl,
        linkLabel: a.linkLabel,
        tone: a.tone,
        countdownTo: a.countdownTo ? a.countdownTo.toISOString() : null,
        countdownLabel: a.countdownLabel,
        countdownEndText: a.countdownEndText,
        dismissible: a.dismissible,
        version: a.updatedAt.getTime(),
      }))
  } catch (err) {
    console.error('[site-controls] could not read site_announcements:', err)
    return []
  }
})
