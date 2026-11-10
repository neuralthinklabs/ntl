import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { DigestForm } from '@/components/community/digest-form'
import { getViewer } from '@/lib/community/authz'
import { getDigestPref } from '@/lib/collab/queries'

export const metadata: Metadata = { title: 'Community settings', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function CommunitySettingsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/community/settings')
  const pref = await getDigestPref(viewer.id)
  return (
    <SiteShell>
      <PageHero title="Community settings" description="Choose whether we email you a summary of what you missed." />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <DigestForm initial={pref} />
          <p className="mt-4 text-xs text-slate-600">Off by default. A digest lists the titles of your unread notifications (never message text) and links back here.</p>
        </div>
      </div>
    </SiteShell>
  )
}
