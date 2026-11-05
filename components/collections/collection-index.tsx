import Image from 'next/image'
import Link from 'next/link'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { COLLECTION_LABEL, COLLECTION_PATH, COLLECTION_PLURAL, listCollections, type CollectionKind } from '@/lib/collections'

const blurb: Record<CollectionKind, string> = {
  series: 'Multi-part stories that build on each other. Start at Part 1.',
  magazine: 'Issue-based publications curated by the NTL team.',
}

export async function CollectionIndex({ kind }: { kind: CollectionKind }) {
  const items = await listCollections(kind)
  return (
    <SiteShell>
      <PageHero title={COLLECTION_PLURAL[kind]} description={blurb[kind]} />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Nothing published yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`${COLLECTION_PATH[kind]}/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  {c.coverImage && (
                    <Image src={c.coverImage} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{COLLECTION_LABEL[kind]}</p>
                  <h3 className="mt-1 text-base font-semibold text-ink">{c.title}</h3>
                  {c.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{c.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
