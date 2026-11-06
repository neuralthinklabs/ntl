import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, Compass, Users } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { PostCard } from '@/components/community/post-card'
import { Composer } from '@/components/community/composer'
import { getViewer } from '@/lib/community/authz'
import { getFeed, getPollData, getPostableGroups } from '@/lib/community/queries'
import { POST_TYPES, POST_TYPE_LABEL } from '@/lib/community/constants'
import { parsePage, totalPages, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Community',
  description: 'Discussions, ideas, polls, research and project updates from the Neural Think Labs community.',
  alternates: { canonical: '/community' },
}
export const dynamic = 'force-dynamic'

const pill = (on: boolean) => cn('rounded-full px-4 py-1.5 text-sm font-medium', on ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50')

export default async function CommunityFeedPage({ searchParams }: { searchParams: Promise<{ page?: string; type?: string }> }) {
  const sp = await searchParams
  const { page } = parsePage(sp)
  const type = POST_TYPES.find((t) => t === sp.type)
  const viewer = await getViewer()
  const [{ items, total }, groups] = await Promise.all([
    getFeed({ viewerId: viewer?.id ?? null, page, type }),
    viewer ? getPostableGroups(viewer.id) : Promise.resolve([]),
  ])
  const polls = await getPollData(items.filter((p) => p.type === 'poll').map((p) => p.id), viewer?.id ?? null)
  const composerGroups = groups.map((g) => ({ id: g.id, name: g.name, kind: g.kind, canModerate: g.role !== 'member' || !!viewer?.isAdmin }))

  return (
    <SiteShell>
      <PageHero title="Community" description="Ideas, discussions, research and project updates from people working on real problems together." />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-5">
            <Composer groups={composerGroups} loggedIn={!!viewer} verified={!!viewer?.verified} nextPath="/community" />
            <nav aria-label="Filter by type" className="flex flex-wrap gap-2">
              <Link href="/community" className={pill(!type)}>All</Link>
              {POST_TYPES.map((t) => <Link key={t} href={`/community?type=${t}`} className={pill(type === t)} aria-current={type === t ? 'true' : undefined}>{POST_TYPE_LABEL[t]}s</Link>)}
            </nav>
            {items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
                Nothing here yet. <Link href="/community/discover" className="font-medium text-brand-muted underline">Find a group</Link> and start a conversation.
              </p>
            )}
            {items.map((p) => <PostCard key={p.id} post={p} poll={polls[p.id]} loggedIn={!!viewer && !viewer.blocked} viewerId={viewer?.id ?? null} />)}
            <Pager page={page} totalPages={totalPages(total, DEFAULT_PAGE_SIZE)} basePath={type ? `/community?type=${type}` : '/community'} />
          </div>
          <aside className="flex flex-col gap-3 text-sm">
            <Link href="/community/discover" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-medium text-ink shadow-sm hover:shadow-md"><Compass className="size-5 text-brand-muted" /> Discover communities</Link>
            <Link href="/community/groups" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-medium text-ink shadow-sm hover:shadow-md"><Users className="size-5 text-brand-muted" /> My groups</Link>
            {viewer && <Link href="/community/notifications" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-medium text-ink shadow-sm hover:shadow-md"><Bell className="size-5 text-brand-muted" /> Notifications</Link>}
            <p className="rounded-2xl bg-brand/5 p-4 text-xs leading-relaxed text-slate-700 ring-1 ring-inset ring-brand/15">
              This feed shows public groups and the groups you belong to. Be kind and constructive. You can report or block anyone, and moderators review every report.
            </p>
          </aside>
        </div>
      </div>
    </SiteShell>
  )
}
