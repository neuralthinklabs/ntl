import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Search } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { getViewer } from '@/lib/community/authz'
import { listCommunities } from '@/lib/community/queries'
import { searchPeople, searchPosts } from '@/lib/community/search'
import { KIND_LABEL, POST_TYPE_LABEL, groupHref } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'

export const metadata: Metadata = { title: 'Search the community', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function CommunitySearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const viewer = await getViewer()
  const ready = q.length >= 2
  const results = ready
    ? await Promise.all([searchPosts({ viewerId: viewer?.id ?? null, q }), listCommunities({ viewerId: viewer?.id ?? null, q, page: 1 }), searchPeople(q)])
    : null

  return (
    <SiteShell>
      <PageHero title="Search" description="Find discussions, groups and people. Private and internal groups only appear for their members." />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <form action="/community/search" role="search" className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="cs-q" className="sr-only">Search the community</label>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input id="cs-q" name="q" defaultValue={q} autoFocus placeholder="Search posts, groups and people" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none focus:border-brand-muted focus:ring-2 focus:ring-brand/30" />
          </div>
          <button type="submit" className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-3">Search</button>
        </form>

        {!results && <p className="mt-8 text-sm text-slate-600">{q ? 'Type at least 2 characters.' : 'Try a topic, a group name, or a person’s name or NTL ID.'}</p>}

        {results && (() => {
          const [posts, groups, people] = results
          return (
            <div className="mt-8 flex flex-col gap-10">
              <section aria-labelledby="sr-posts">
                <h2 id="sr-posts" className="text-sm font-semibold uppercase tracking-wide text-slate-600">Posts ({posts.length})</h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {posts.length === 0 && <li className="text-sm text-slate-600">No posts match.</li>}
                  {posts.map((p) => (
                    <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-600">
                        {POST_TYPE_LABEL[p.type] ?? p.type} · <Link href={groupHref({ slug: p.communitySlug, visibility: p.communityVisibility })} className="font-medium text-brand-muted hover:underline">{p.communityName}</Link> · {formatDate(p.createdAt)}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-ink"><Link href={`/community/post/${p.id}`} className="hover:underline">{p.title || p.body.slice(0, 80)}</Link></h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-700">{p.body}</p>
                      <p className="mt-1 text-xs text-slate-600">by {p.authorName ?? 'Former member'}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="sr-groups">
                <h2 id="sr-groups" className="text-sm font-semibold uppercase tracking-wide text-slate-600">Groups ({groups.items.length})</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {groups.items.length === 0 && <li className="text-sm text-slate-600">No groups match.</li>}
                  {groups.items.map((g) => (
                    <li key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-600">{KIND_LABEL[g.kind]} · {g.members} member{g.members === 1 ? '' : 's'}</p>
                      <h3 className="mt-1 text-sm font-semibold text-ink"><Link href={groupHref(g)} className="hover:underline">{g.name}</Link></h3>
                      {g.description && <p className="mt-1 line-clamp-2 text-sm text-slate-700">{g.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="sr-people">
                <h2 id="sr-people" className="text-sm font-semibold uppercase tracking-wide text-slate-600">People ({people.length})</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {people.length === 0 && <li className="text-sm text-slate-600">No one matches.</li>}
                  {people.map((p) => (
                    <li key={p.ntlId}>
                      <Link href={`/community/members/${p.ntlId}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-ink hover:bg-slate-50">
                        {p.name || p.ntlId}
                        {p.verified && <BadgeCheck className="size-3.5 text-brand-muted" aria-label="Verified contributor" />}
                        <span className="font-mono text-xs text-slate-600">{p.ntlId}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )
        })()}
      </div>
    </SiteShell>
  )
}
