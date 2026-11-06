import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { BadgeCheck } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PostCard } from '@/components/community/post-card'
import { ActionButton } from '@/components/community/action-button'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { getViewer } from '@/lib/community/authz'
import { getFeed, getParticipation, getPollData } from '@/lib/community/queries'
import { normalizeNtlId } from '@/lib/ntl-id'
import { publicRoleLabel } from '@/lib/roles'
import { ROLE_LABEL, groupHref } from '@/lib/community/constants'
import { blockUser } from '@/actions/community'

type Props = { params: Promise<{ ntlId: string }> }
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Member', robots: { index: false, follow: false } }

export default async function MemberPage({ params }: Props) {
  const { ntlId: raw } = await params
  const ntlId = normalizeNtlId(raw)
  if (!ntlId) notFound()
  const [p] = await db.select({ id: profiles.id, name: profiles.fullName, bio: profiles.bio, ntlId: profiles.ntlId, showCredit: profiles.showCredit, role: profiles.role, verified: profiles.verifiedContributor }).from(profiles).where(eq(profiles.ntlId, ntlId)).limit(1)
  if (!p) notFound()
  const viewer = await getViewer()

  // Respect "show my name publicly": hide name, bio and history when it is off.
  if (!p.showCredit && viewer?.id !== p.id) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="font-mono text-sm text-slate-600">{p.ntlId}</p>
          <h1 className="mt-2 text-xl font-semibold text-ink">This member keeps their profile private</h1>
        </div>
      </SiteShell>
    )
  }

  const [part, feed] = await Promise.all([getParticipation(p.id), getFeed({ viewerId: viewer?.id ?? null, page: 1, authorId: p.id })])
  const polls = await getPollData(feed.items.filter((x) => x.type === 'poll').map((x) => x.id), viewer?.id ?? null)
  const name = p.name || p.ntlId
  const initials = name.split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'N'
  const role = publicRoleLabel(p.role)

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="flex items-center gap-5">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-brand-foreground">{initials}</span>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-ink">{name}{p.verified && <BadgeCheck className="size-5 text-brand-muted" aria-label="Verified contributor" />}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-mono">{p.ntlId}</span>
              {role && <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-muted">{role}</span>}
              {p.showCredit && <Link href={`/u/${p.ntlId}`} className="text-xs font-medium text-brand-muted underline">NTL credits</Link>}
            </p>
          </div>
          {viewer && viewer.id !== p.id && <div className="ml-auto"><ActionButton action={blockUser.bind(null, p.id)} label="Block" confirm="Block this person? You will stop seeing their posts and comments." variant="danger" /></div>}
        </div>
        {p.bio && <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.bio}</p>}

        <dl className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[['Public posts', part.posts], ['Public comments', part.comments], ['Public groups', part.groups.length]].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><dd className="text-2xl font-semibold text-ink">{v}</dd><dt className="mt-0.5 text-xs text-slate-600">{l}</dt></div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-slate-600">Counts and history include public groups only. Private and internal activity is never shown here.</p>

        {part.groups.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Groups</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {part.groups.map((g) => <li key={g.slug}><Link href={groupHref({ slug: g.slug, visibility: 'public' })} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-ink hover:bg-slate-50">{g.name}{g.role !== 'member' ? ` · ${ROLE_LABEL[g.role]}` : ''}</Link></li>)}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent posts</h2>
          <div className="mt-4 flex flex-col gap-4">
            {feed.items.length === 0 && <p className="text-sm text-slate-600">No posts to show.</p>}
            {feed.items.map((x) => <PostCard key={x.id} post={x} poll={polls[x.id]} loggedIn={!!viewer && !viewer.blocked} viewerId={viewer?.id ?? null} />)}
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
