import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Small uppercase eyebrow. brand-muted (#1f4fd8) passes contrast on white.
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted', className)}>{children}</p>
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
      {description && <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  )
}

type StatusTone = 'active' | 'progress' | 'planned' | 'completed' | 'neutral'

const statusStyles: Record<StatusTone, string> = {
  active: 'bg-brand-soft text-brand-muted ring-brand/30',
  progress: 'bg-brand-soft text-brand-muted ring-brand/30',
  planned: 'bg-slate-100 text-slate-700 ring-slate-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function StatusBadge({ tone = 'neutral', children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', statusStyles[tone], className)}>
      {tone === 'active' && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
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
      <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-all" style={{ width: `${v}%` }} />
    </div>
  )
}

export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn('inline-flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand-muted ring-1 ring-inset ring-brand/20', className)}>
      <Icon className="size-5" />
    </span>
  )
}
