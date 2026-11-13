import Link from 'next/link'
import { asc, desc } from 'drizzle-orm'
import { db } from '@/db'
import { pageControls, siteAnnouncements } from '@/db/site-schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { AnnouncementForm, PageControlForm } from '@/components/admin/site-controls'
import { ActionButton } from '@/components/community/action-button'
import { deleteAnnouncement, deletePageControl, setAnnouncementActive, setPageControlEnabled } from '@/actions/admin/site'
import { isBlockedNow } from '@/lib/site-controls'
import { dateToZonedLocal } from '@/lib/tz'
import { formatDate } from '@/lib/datetime'

export const metadata = { title: 'Site controls' }
export const dynamic = 'force-dynamic'

const local = (d: Date | null) => (d ? dateToZonedLocal(d, 'UTC') : '')
const at = (d: Date | null) =>
  d ? `${formatDate(d, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })} UTC` : null

export default async function AdminSitePage({ searchParams }: { searchParams: Promise<{ editA?: string; editP?: string }> }) {
  const sp = await searchParams
  const [anns, controls] = await Promise.all([
    db.select().from(siteAnnouncements).orderBy(desc(siteAnnouncements.createdAt)).limit(50),
    db.select().from(pageControls).orderBy(asc(pageControls.pathPrefix)),
  ])
  const now = new Date()
  const editA = anns.find((a) => a.id === sp.editA)
  const editP = controls.find((c) => c.id === sp.editP)

  const annStatus = (a: (typeof anns)[number]) =>
    !a.active ? 'Hidden' : a.startsAt && a.startsAt > now ? 'Scheduled' : a.endsAt && a.endsAt <= now ? 'Ended' : 'Showing'
  const ctlStatus = (c: (typeof controls)[number]) =>
    !c.enabled ? 'Open' : isBlockedNow(c, now) ? 'Blocked now' : c.opensAt && c.opensAt <= now ? 'Finished (open)' : 'Scheduled'
  const tone: Record<string, string> = {
    Showing: 'bg-emerald-100 text-emerald-800', 'Blocked now': 'bg-red-100 text-red-700', Scheduled: 'bg-amber-100 text-amber-800',
    Hidden: 'bg-slate-200 text-slate-700', Ended: 'bg-slate-200 text-slate-700', Open: 'bg-slate-200 text-slate-700', 'Finished (open)': 'bg-slate-200 text-slate-700',
  }

  return (
    <>
      <AdminHeader title="Site controls" description="Show announcements and countdowns across the site, and block or open pages. Changes apply within seconds." />

      <section id="announcements" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Announcements</h2>
        <p className="text-sm text-slate-600">Up to the 3 newest live announcements show in a bar above the navigation on every page.</p>
        <div className="flex flex-col gap-3">
          {anns.length === 0 && <EmptyState>No announcements yet.</EmptyState>}
          {anns.map((a) => {
            const s = annStatus(a)
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-medium text-ink">{a.message}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${tone[s]}`}>{s}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {a.startsAt ? `from ${at(a.startsAt)} ` : ''}{a.endsAt ? `until ${at(a.endsAt)} ` : ''}{a.countdownTo ? `· countdown to ${at(a.countdownTo)}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/admin/site?editA=${a.id}#announcements`} className="text-xs font-medium text-brand-muted underline">Edit</Link>
                  <ActionButton action={setAnnouncementActive.bind(null, a.id, !a.active)} label={a.active ? 'Hide' : 'Show'} />
                  <ActionButton action={deleteAnnouncement.bind(null, a.id)} label="Delete" confirm="Delete this announcement?" variant="danger" />
                </div>
              </div>
            )
          })}
        </div>
        <AnnouncementForm
          key={editA?.id ?? 'new-announcement'}
          initial={editA && {
            id: editA.id, message: editA.message, linkUrl: editA.linkUrl ?? '', linkLabel: editA.linkLabel ?? '', tone: editA.tone,
            startsAt: local(editA.startsAt), endsAt: local(editA.endsAt), countdownTo: local(editA.countdownTo),
            countdownLabel: editA.countdownLabel ?? '', countdownEndText: editA.countdownEndText ?? '', dismissible: editA.dismissible, active: editA.active,
          }}
        />
        {editA && <p className="text-xs text-slate-600">Editing times are shown in UTC. <Link href="/admin/site#announcements" className="underline">Stop editing</Link></p>}
      </section>

      <section id="pages" className="mt-12 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Page controls</h2>
        <p className="text-sm text-slate-600">
          A blocked page shows your message instead of its content. Signed-in admins can still open it to preview. This also stops the matching sign-up and submit forms (problems, volunteer, pledges, contact and new community posts).
        </p>
        <div className="flex flex-col gap-3">
          {controls.length === 0 && <EmptyState>No page rules. Every page is open.</EmptyState>}
          {controls.map((c) => {
            const s = ctlStatus(c)
            return (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-ink">{c.pathPrefix === '*' ? '* (whole site)' : c.pathPrefix}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${tone[s]}`}>{s}</span>
                </div>
                {(c.title || c.message) && <p className="mt-1 text-xs text-slate-700">{c.title}{c.title && c.message ? ': ' : ''}{c.message}</p>}
                <p className="mt-1 text-xs text-slate-600">
                  {c.blocksAt ? `blocks ${at(c.blocksAt)} ` : 'blocks immediately '}{c.opensAt ? `· opens ${at(c.opensAt)}${c.showCountdown ? ' (countdown shown)' : ''}` : '· stays blocked until opened'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/admin/site?editP=${c.id}#pages`} className="text-xs font-medium text-brand-muted underline">Edit</Link>
                  {c.enabled ? (
                    <ActionButton action={setPageControlEnabled.bind(null, c.id, false)} label="Open now" variant="primary" confirm="Open this page now?" />
                  ) : (
                    <ActionButton action={setPageControlEnabled.bind(null, c.id, true)} label="Block now" confirm="Block this page now?" />
                  )}
                  <ActionButton action={deletePageControl.bind(null, c.id)} label="Delete rule" confirm="Delete this rule? The page will be open." variant="danger" />
                </div>
              </div>
            )
          })}
        </div>
        <PageControlForm
          key={editP?.id ?? 'new-control'}
          initial={editP && {
            id: editP.id, pathPrefix: editP.pathPrefix, title: editP.title ?? '', message: editP.message ?? '',
            blocksAt: local(editP.blocksAt), opensAt: local(editP.opensAt), showCountdown: editP.showCountdown,
          }}
        />
        {editP && <p className="text-xs text-slate-600">Editing times are shown in UTC. <Link href="/admin/site#pages" className="underline">Stop editing</Link></p>}
      </section>
    </>
  )
}
