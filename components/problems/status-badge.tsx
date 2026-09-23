import { cn } from '@/lib/utils'

const labels: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  declined: 'Declined',
}

const colors: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-100 text-amber-700',
  accepted: 'bg-brand/10 text-brand-muted',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-600',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
        colors[status] ?? colors.submitted,
      )}
    >
      {labels[status] ?? status}
    </span>
  )
}
