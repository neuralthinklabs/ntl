'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  Droplets,
  GraduationCap,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { PortfolioType } from '@/lib/data'
import { StatusBadge } from '@/components/site/ui'
import { cn } from '@/lib/utils'

const filters: ('All' | PortfolioType)[] = [
  'All',
  'Product',
  'Service',
  'Venture',
  'System',
  'Publication',
]

const icons: Record<string, LucideIcon> = {
  NeuroLearn: GraduationCap,
  'Community Research Hub': Users,
  'Clean Water Initiative': Droplets,
  'Open Knowledge Library': BookOpen,
  'Impact Analytics System': BarChart3,
  'Mentor Network': Boxes,
}

function statusTone(status: string) {
  if (status === 'Active') return 'active' as const
  if (status === 'In Progress') return 'progress' as const
  if (status === 'Completed') return 'completed' as const
  return 'planned' as const
}

// P2 follow-up: `portfolio` used to be imported directly from lib/data.ts
// (static mock data). It's now passed in as `items`, fetched server-side
// from the real `portfolio_items` table by app/portfolio/page.tsx via
// lib/portfolio.ts — this component no longer knows or cares where the
// data came from.
export type PortfolioListItem = {
  name: string
  type: PortfolioType
  status: string
  description: string
}

export function PortfolioList({ items }: { items: PortfolioListItem[] }) {
  const [active, setActive] = useState<'All' | PortfolioType>('All')

  const filtered = useMemo(
    () =>
      active === 'All'
        ? items
        : items.filter((p) => p.type === active),
    [active, items],
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActive(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active === f
                ? 'bg-brand text-brand-foreground'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {filtered.map((item) => {
          const Icon = icons[item.name] ?? Boxes
          return (
            <article
              key={item.name}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
            >
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-ink">
                    {item.name}
                  </h3>
                  <StatusBadge tone={statusTone(item.status)}>
                    {item.status}
                  </StatusBadge>
                </div>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-muted">
                  {item.type}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-slate-50"
              >
                Enquire <ArrowRight className="size-4" />
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
