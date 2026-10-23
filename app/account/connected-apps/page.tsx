import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { RevokeButton } from '@/components/account/revoke-button'
import { createClient } from '@/lib/supabase/server'
import { SCOPE_COPY, oauthUser } from '@/lib/oauth'
import { formatDate } from '@/lib/datetime'

export const metadata: Metadata = { title: 'Connected apps', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function ConnectedAppsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account/connected-apps')

  const { data, error } = await oauthUser(supabase).listGrants()
  const grants = data ?? []

  return (
    <SiteShell>
      <PageHero title="Connected apps" description="Websites and apps where you signed in with your NTL ID." />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">Could not load your connected apps. Try again later.</p>}
        {!error && grants.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No apps are connected to your NTL ID yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {grants.map((g, i) => (
              <li key={g.client?.id ?? i} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{g.client?.name ?? 'Unnamed app'}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Can see: {(g.scopes ?? []).map((s) => SCOPE_COPY[s]?.title ?? s).join(', ') || 'your account ID'}
                    {g.granted_at ? `. Allowed ${formatDate(g.granted_at)}` : ''}
                  </p>
                </div>
                {g.client?.id && <RevokeButton clientId={g.client.id} appName={g.client.name ?? 'this app'} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteShell>
  )
}
