import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryCardData } from '@/lib/stories'

// Server component: category pills are links, so filtering and paging happen
// in the database and every filtered view has its own URL.
export function StoriesList({ items, categories, active }: { items: StoryCardData[]; categories: string[]; active: string }) {
  return (
    <div>
      <nav className="flex flex-wrap gap-2" aria-label="Filter by category">
        {categories.map((c) => (
          <Link
            key={c}
            href={c === 'All' ? '/stories' : `/stories?category=${encodeURIComponent(c)}`}
            aria-current={active === c ? 'true' : undefined}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active === c ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
            )}
          >
            {c}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          {active === 'All' ? 'No stories published yet. Check back soon.' : 'No stories in this category yet.'}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <article key={s.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {s.image && (
                  <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-brand-muted">{s.category}</span>
                  <span className="text-slate-600">{s.date}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.excerpt}</p>
                <Link href={`/stories/${s.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:underline">
                  Read more <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
