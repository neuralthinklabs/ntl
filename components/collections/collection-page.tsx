import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { COLLECTION_LABEL, COLLECTION_PATH, COLLECTION_PLURAL, getCollection, type CollectionKind } from '@/lib/collections'
import { formatDate } from '@/lib/datetime'

type Props = { params: Promise<{ slug: string }> }

export async function collectionMetadata(kind: CollectionKind, { params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = await getCollection(kind, slug)
  if (!c) return { title: 'Not found' }
  return {
    title: c.title,
    description: c.description?.slice(0, 160) || undefined,
    alternates: { canonical: `${COLLECTION_PATH[kind]}/${c.slug}` },
    openGraph: { title: c.title, images: c.coverImage ? [{ url: c.coverImage }] : undefined },
  }
}

export async function CollectionPage({ kind, params }: Props & { kind: CollectionKind }) {
  const { slug } = await params
  const c = await getCollection(kind, slug)
  if (!c) notFound()

  // Magazines group by issue; a series is one numbered list.
  const groups = new Map<number | null, typeof c.stories>()
  for (const s of c.stories) {
    const key = kind === 'magazine' ? s.issue : null
    groups.set(key, [...(groups.get(key) ?? []), s])
  }

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href={COLLECTION_PATH[kind]} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> All {COLLECTION_PLURAL[kind].toLowerCase()}
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">{COLLECTION_LABEL[kind]}</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{c.title}</h1>
        {c.description && <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-slate-600">{c.description}</p>}
        {c.coverImage && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
            <Image src={c.coverImage} alt="" fill priority sizes="768px" className="object-cover" />
          </div>
        )}

        {c.stories.length === 0 && <p className="mt-10 text-sm text-slate-600">No stories published here yet.</p>}
        {[...groups.entries()].map(([issue, items]) => (
          <section key={issue ?? 'all'} className="mt-12">
            {kind === 'magazine' && <h2 className="text-lg font-semibold text-ink">{issue ? `Issue ${issue}` : 'Other articles'}</h2>}
            <ol className="mt-4 flex flex-col gap-3">
              {items.map((s, i) => (
                <li key={s.id}>
                  <Link href={`/stories/${s.slug}`} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand-muted">
                      {kind === 'series' ? i + 1 : '•'}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {kind === 'series' && <span className="mr-1.5 text-slate-600">Part {i + 1}:</span>}
                        {s.title}
                      </span>
                      {s.excerpt && <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600">{s.excerpt}</span>}
                      {s.publishedAt && <span className="mt-1 block text-xs text-slate-500">{formatDate(s.publishedAt)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </article>
    </SiteShell>
  )
}
