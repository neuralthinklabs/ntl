import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { Prose } from '@/components/site/prose'
import { getStoryBySlug } from '@/lib/stories'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'

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

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> All stories
        </Link>
        <p className="mt-6 text-sm text-slate-600">
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-medium text-brand-muted">{s.category}</span>
          <span className="ml-3">{s.date}</span>
          {s.authorName && <span> · {s.authorName}</span>}
        </p>
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
