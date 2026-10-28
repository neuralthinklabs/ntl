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

export type PortfolioListItem = {
  name: string
  type: PortfolioType
  status: string
  description: string
  people?: { ntlId: string; name: string; roleLabel: string }[]
}

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
              'h-9 rounded-full px-4 text-sm font-medium transition-colors',
              active === f ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {filtered.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Nothing in this category yet.
          </p>
        )}
        {filtered.map((item) => {
          const Icon = TYPE_ICONS[item.type] ?? Boxes
          return (
            <article key={item.name} className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md hover:shadow-brand/10">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-muted ring-1 ring-inset ring-brand/25">
                  <Icon className="size-5" />
                </span>
                <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">{item.name}</h3>
              <p className="mt-0.5 text-sm font-medium text-brand-muted">{item.type}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                {item.people && item.people.length > 0 && (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Team</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {item.people.map((p) => (
                        <li key={p.ntlId}>
                          <Link
                            href={`/u/${p.ntlId}`}
                            title={`${p.name} · ${p.roleLabel}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-xs font-medium text-ink hover:bg-slate-50"
                          >
                            <span className="flex size-6 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                              {p.name.split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                            </span>
                            {p.name}
                            <span className="text-slate-600">· {p.roleLabel}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </article>
          )
        })}
      </div>

      {/* One contact link for the whole page instead of one per card. */}
      <p className="mt-10 text-sm text-slate-600">
        Interested in a project or a partnership?{' '}
        <Link href="/contact" className="inline-flex items-center gap-1 font-semibold text-brand-muted underline-offset-4 hover:underline">
          Get in touch <ArrowRight className="size-4" />
        </Link>
      </p>
    </div>
  )
}
