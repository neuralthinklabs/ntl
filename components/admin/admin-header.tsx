import Link from 'next/link'
import { Plus } from 'lucide-react'

export function AdminHeader({
  title,
  description,
  newHref,
  newLabel,
}: {
  title: string
  description?: string
  newHref?: string
  newLabel?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-sm text-slate-600">{description}</p>}
      </div>
      {newHref && (
        <Link
          href={newHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
        >
          <Plus className="size-4" /> {newLabel ?? 'New'}
        </Link>
      )}
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
      {children}
    </p>
  )
}

export function FilterPills({
  basePath,
  current,
  options,
}: {
  basePath: string
  current: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter">
      {options.map((o) => (
        <Link
          key={o.value}
          href={o.value === 'all' ? basePath : `${basePath}?status=${o.value}`}
          aria-current={current === o.value ? 'true' : undefined}
          className={
            current === o.value
              ? 'rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
          }
        >
          {o.label}
        </Link>
      ))}
    </div>
  )
}
