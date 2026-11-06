import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { AppealForm } from '@/components/community/appeal-form'
import { getViewer } from '@/lib/community/authz'
import { getMyModeration } from '@/lib/community/queries'
import { APPEALABLE, MOD_ACTION_LABEL } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'

export const metadata: Metadata = { title: 'Moderation decisions and appeals', robots: { index: false } }
export const dynamic = 'force-dynamic'

const APPEAL_LABEL: Record<string, string> = { pending: 'Appeal under review', upheld: 'Appeal reviewed: decision stands', overturned: 'Appeal accepted: decision reversed' }

export default async function AppealsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/community/appeals')
  const rows = await getMyModeration(viewer.id)
  return (
    <SiteShell>
      <PageHero title="Moderation decisions" description="Decisions that affect you, and the chance to appeal them. An NTL administrator reviews every appeal." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <ul className="flex flex-col gap-4">
          {rows.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No moderation decisions about you. Nice.</li>}
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-ink">{MOD_ACTION_LABEL[r.action] ?? r.action}{r.communityName ? ` · ${r.communityName}` : ' · community-wide'}</p>
              <p className="mt-0.5 text-xs text-slate-600">{formatDate(r.createdAt)}{r.expiresAt ? ` · until ${formatDate(r.expiresAt)}` : ''}</p>
              {r.reason && <p className="mt-2 text-sm text-slate-700">Reason given: {r.reason}</p>}
              <div className="mt-3">
                {r.appealStatus ? (
                  <p className="text-sm text-slate-700"><span className="font-medium text-ink">{APPEAL_LABEL[r.appealStatus]}</span>{r.appealNote ? `: ${r.appealNote}` : ''}</p>
                ) : (APPEALABLE as readonly string[]).includes(r.action) ? (
                  <AppealForm actionId={r.id} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  )
}
