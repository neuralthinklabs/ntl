import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { ConsentForm } from '@/components/oauth/consent-form'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { AUTH_ID_RE, SCOPE_COPY, isSafeRedirect, oauthUser, parseScopes } from '@/lib/oauth'

export const metadata: Metadata = { title: 'Sign in with NTL ID', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </SiteShell>
  )
}

function Problem({ text }: { text: string }) {
  return (
    <Shell>
      <h1 className="text-xl font-semibold tracking-tight text-ink">This sign-in link does not work</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    </Shell>
  )
}

export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  const { authorization_id: id } = await searchParams
  if (!id || !AUTH_ID_RE.test(id)) return <Problem text="Go back to the app you were signing in to and start again." />

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Not logged in: log in (or sign up) first, then land back here.
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${id}`)}`)

  const { data, error } = await oauthUser(supabase).getAuthorizationDetails(id)
  if (error || !data) return <Problem text="This request expired or was already used. Go back to the app and start again." />

  // Already approved before: Supabase tells us to send the user straight back.
  if (data.redirect_url) {
    if (!isSafeRedirect(data.redirect_url)) return <Problem text="This request points to an address NTL does not allow." />
    redirect(data.redirect_url)
  }

  const appName = data.client?.name?.trim() || 'An application'
  const scopes = parseScopes(data.scope ?? data.scopes)
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })

  return (
    <Shell>
      <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in to {appName} with your NTL ID</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        You are signed in as <strong className="text-ink">{profile?.fullName || user.email}</strong>
        {profile?.ntlId && <> (<span className="font-mono">{profile.ntlId}</span>)</>}. {appName} will receive:
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {scopes.length === 0 && <li className="text-sm text-slate-600">Your NTL account ID only.</li>}
        {scopes.map((s) => (
          <li key={s} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-ink">{SCOPE_COPY[s]?.title ?? s}</p>
            {SCOPE_COPY[s] && <p className="mt-0.5 text-xs text-slate-600">{SCOPE_COPY[s].text}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-slate-600">
        {appName} never sees your NTL password. You can remove its access any time under Connected apps in your dashboard.
      </p>
      <ConsentForm authorizationId={id} appName={appName} />
    </Shell>
  )
}
