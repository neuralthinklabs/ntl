import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Eyebrow label with the brand's small blue square (echoes the notch in the logo).
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted', className)}>
      <span aria-hidden className="size-1.5 shrink-0 bg-brand" />
      {children}
    </p>
  )
}

export function SectionHeading({
  label,
  title,
  description,
  className,
}: {
  label?: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {label && <SectionLabel>{label}</SectionLabel>}
      <h2 className={cn('text-3xl font-semibold tracking-tight text-ink sm:text-4xl', label && 'mt-3')}>{title}</h2>
      <span aria-hidden className="mt-3 block h-0.5 w-10 bg-brand" />
      {description && <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  )
}

type StatusTone = 'active' | 'progress' | 'planned' | 'completed' | 'neutral'

const statusStyles: Record<StatusTone, string> = {
  active: 'bg-brand-soft text-brand-muted ring-brand/30',
  progress: 'bg-brand-soft text-brand-muted ring-brand/30',
  planned: 'bg-slate-100 text-slate-700 ring-slate-200',
  completed: 'bg-ink text-white ring-ink',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function StatusBadge({ tone = 'neutral', children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', statusStyles[tone], className)}>
      {tone === 'active' && <span className="size-1.5 bg-brand" aria-hidden />}
      {children}
    </span>
  )
}

export function ProgressBar({ value, className, tone = 'brand', label = 'Funding progress' }: { value: number; className?: string; tone?: 'brand' | 'dark'; label?: string }) {
  const v = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full', tone === 'brand' ? 'bg-slate-200' : 'bg-white/15', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-ink-2 to-brand transition-all" style={{ width: `${v}%`, backgroundImage: tone === 'dark' ? 'linear-gradient(90deg,#38b6ff,#0a6fd8)' : undefined }} />
    </div>
  )
}

// Geometric tile (rounded square) instead of a circle, per the brand's modular shapes.
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn('inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-muted ring-1 ring-inset ring-brand/25', className)}>
      <Icon className="size-5" />
    </span>
  )
}
