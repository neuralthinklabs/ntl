import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// brand-muted (#0c5d47) passes contrast on white; the bright brand green does not.
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm font-semibold text-brand-muted', className)}>{children}</p>
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
      <h2 className={cn('text-2xl font-semibold tracking-tight text-ink sm:text-3xl', label && 'mt-2')}>{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  )
}

type StatusTone = 'active' | 'progress' | 'planned' | 'completed' | 'neutral'

const statusStyles: Record<StatusTone, string> = {
  active: 'bg-brand-soft text-brand-muted ring-brand/20',
  progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  planned: 'bg-slate-100 text-slate-700 ring-slate-200',
  completed: 'bg-brand-soft text-brand-muted ring-brand/20',
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
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${v}%` }} />
    </div>
  )
}

export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn('inline-flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-muted', className)}>
      <Icon className="size-5" />
    </span>
  )
}
