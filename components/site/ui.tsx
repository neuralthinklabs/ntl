import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand',
        className,
      )}
    >
      {children}
    </p>
  )
}

type StatusTone = 'active' | 'progress' | 'planned' | 'completed' | 'neutral'

const statusStyles: Record<StatusTone, string> = {
  active: 'bg-brand/10 text-brand-muted ring-brand/20',
  progress: 'bg-amber-100 text-amber-700 ring-amber-200',
  planned: 'bg-slate-100 text-slate-600 ring-slate-200',
  completed: 'bg-brand/10 text-brand-muted ring-brand/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function StatusBadge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: StatusTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        statusStyles[tone],
        className,
      )}
    >
      {tone === 'active' && (
        <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      )}
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  className,
  tone = 'brand',
}: {
  value: number
  className?: string
  tone?: 'brand' | 'dark'
}) {
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full',
        tone === 'brand' ? 'bg-slate-200' : 'bg-white/15',
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function IconTile({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}
