import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LEVEL_LABEL, type AtlasLevel } from '@/lib/atlas-constants'

export function UnitCard({
  code,
  name,
  level,
  parent,
  summary,
}: {
  code: string
  name: string
  level: AtlasLevel
  parent?: string | null
  summary?: string | null
}) {
  return (
    <Link
      href={`/atlas/${code}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-medium text-brand-muted">{code}</span>
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-muted">{LEVEL_LABEL[level]}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-ink">{name}</h3>
      {parent && <p className="mt-0.5 text-xs text-slate-600">in {parent}</p>}
      {summary && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{summary}</p>}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-muted">
        Open profile <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
