import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { DraftForm } from '@/components/team/draft-form'
import { requireTeamPage } from '@/lib/auth/admin'
import { db } from '@/db'
import { assignments, stories } from '@/db/schema'

export const metadata: Metadata = { title: 'Write', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function TeamPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { user } = await requireTeamPage(`/team/posts/${id}`)

  // Must be THIS user's own writing assignment.
  const [a] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.assigneeId, user.id), eq(assignments.kind, 'blog_post')))
  if (!a || !a.storyId) notFound()
  const story = await db.query.stories.findFirst({ where: eq(stories.id, a.storyId) })
  if (!story) notFound()

  const locked = !!story.publishedAt || a.status === 'done' || a.status === 'cancelled'

  return (
    <SiteShell>
      <PageHero title={a.title} description="Write your draft, save as you go, then submit it for review. An admin publishes it." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/team" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> Back to workspace
        </Link>
        {a.brief && <p className="mb-6 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">{a.brief}</p>}
        <DraftForm
          assignmentId={a.id}
          locked={locked}
          initial={{ title: story.title, excerpt: story.excerpt ?? '', body: story.body ?? '' }}
        />
      </div>
    </SiteShell>
  )
}
