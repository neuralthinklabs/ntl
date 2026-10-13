'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, Boxes, Droplets, GraduationCap, Users, type LucideIcon } from 'lucide-react'
import { StatusBadge } from '@/components/site/ui'
import { cn } from '@/lib/utils'
import { PORTFOLIO_TYPES, type PortfolioType } from '@/lib/portfolio-constants'

const filters: ('All' | PortfolioType)[] = ['All', ...PORTFOLIO_TYPES]

const TYPE_ICONS: Record<PortfolioType, LucideIcon> = {
  Product: GraduationCap,
  Service: Users,
  Venture: Droplets,
  System: BarChart3,
  Publication: BookOpen,
}

function statusTone(status: string) {
  if (status === 'Active') return 'active' as const
  if (status === 'In Progress') return 'progress' as const
  if (status === 'Completed') return 'completed' as const
  return 'planned' as const
}

export type PortfolioListItem = { name: string; type: PortfolioType; status: string; description: string }

export function PortfolioList({ items }: { items: PortfolioListItem[] }) {
  const [active, setActive] = useState<'All' | PortfolioType>('All')
  const filtered = useMemo(() => (active === 'All' ? items : items.filter((p) => p.type === active)), [active, items])

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === f}
            onClick={() => setActive(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active === f ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Nothing in this category yet.</p>
        )}
        {filtered.map((item) => {
          const Icon = TYPE_ICONS[item.type] ?? Boxes
          return (
            <article key={item.name} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-ink">{item.name}</h3>
                  <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                </div>
                <p className="mt-0.5 text-sm font-medium text-brand-muted">{item.type}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
              <Link
                href="/contact"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-slate-50"
              >
                Enquire <ArrowRight className="size-4" />
              </Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
