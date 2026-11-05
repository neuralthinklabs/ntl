import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { Prose } from '@/components/site/prose'
import { getStoryBySlug } from '@/lib/stories'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'
import { AuthorBio } from '@/components/stories/author-bio'
import { COLLECTION_LABEL, COLLECTION_PATH, getCollectionContextBySlug } from '@/lib/collections'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const s = await getStoryBySlug(slug)
  if (!s) return { title: 'Story not found' }
  return {
    title: s.title,
    description: s.excerpt || undefined,
    alternates: { canonical: `/stories/${s.slug}` },
    openGraph: { type: 'article', title: s.title, description: s.excerpt || undefined, images: s.image ? [{ url: s.image }] : undefined },
  }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  const s = await getStoryBySlug(slug)
  if (!s) notFound()
  const gi = goalIndexBySlug(s.ntldgSlug)
  const ctx = await getCollectionContextBySlug(s.slug)

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> All stories
        </Link>
        <p className="mt-6 text-sm text-slate-600">
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-medium text-brand-muted">{s.category}</span>
          <span className="ml-3">{s.date}</span>
          {s.authorName && (
            <span>
              {' · by '}
              {s.authorNtlId ? (
                <Link href={`/u/${s.authorNtlId}`} className="font-medium text-ink underline-offset-2 hover:underline">
                  {s.authorName}
                </Link>
              ) : (
                s.authorName
              )}
              {s.authorNtlId && <span className="ml-1.5 font-mono text-xs text-slate-500">{s.authorNtlId}</span>}
            </span>
          )}
        </p>
        {ctx && (
          <p className="mt-4 text-sm font-medium text-slate-700">
            <Link href={`${COLLECTION_PATH[ctx.collection.kind]}/${ctx.collection.slug}`} className="text-brand-muted underline">
              {COLLECTION_LABEL[ctx.collection.kind]}: {ctx.collection.title}
            </Link>
            {ctx.collection.kind === 'series' ? ` · Part ${ctx.index + 1} of ${ctx.total}` : ctx.issue ? ` · Issue ${ctx.issue}` : ''}
          </p>
        )}
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{s.title}</h1>
        {s.excerpt && <p className="mt-4 text-lg leading-relaxed text-slate-600">{s.excerpt}</p>}
        {s.image && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
            <Image src={s.image} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
          </div>
        )}
        <div className="mt-10">
          <Prose text={s.body} />
        </div>
        {ctx && (ctx.prev || ctx.next) && (
          <nav aria-label="In this collection" className="mt-12 grid gap-3 sm:grid-cols-2">
            {ctx.prev ? (
              <Link href={`/stories/${ctx.prev.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm hover:bg-slate-50">
                <span className="block text-xs text-slate-600">← Previous</span>
                <span className="font-semibold text-ink">{ctx.prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {ctx.next && (
              <Link href={`/stories/${ctx.next.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-right text-sm hover:bg-slate-50">
                <span className="block text-xs text-slate-600">Next →</span>
                <span className="font-semibold text-ink">{ctx.next.title}</span>
              </Link>
            )}
          </nav>
        )}
        {s.authorName && s.authorNtlId && (
          <AuthorBio name={s.authorName} ntlId={s.authorNtlId} bio={s.authorBio} />
        )}
        {gi >= 0 && (
          <p className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
            Part of our goal to{' '}
            <Link href={`/ntldgs/${goals[gi].slug}`} className="font-semibold text-brand-muted underline">
              {goals[gi].verb}: {goals[gi].title}
            </Link>
            .
          </p>
        )}
      </article>
    </SiteShell>
  )
}
