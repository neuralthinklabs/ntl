'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryCardData } from '@/lib/stories'

// P2 #15: now driven by real `stories` rows + derived categories passed
// down from app/stories/page.tsx instead of importing lib/data.ts directly.
export function StoriesList({
  items,
  categories,
}: {
  items: StoryCardData[]
  categories: string[]
}) {
  const [active, setActive] = useState('All')

  const filtered = useMemo(
    () => (active === 'All' ? items : items.filter((s) => s.category === active)),
    [active, items],
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active === c
                ? 'bg-brand text-brand-foreground'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No stories in this category yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <article
              key={s.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-brand-muted">
                    {s.category}
                  </span>
                  <span className="text-slate-400">{s.date}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {s.excerpt}
                </p>
                <Link
                  href="/stories"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand"
                >
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
