import Link from 'next/link'

/** A credited person: links to their public NTL profile. */
export function PersonChip({ name, ntlId, label }: { name: string; ntlId: string; label?: string | null }) {
  const initials = name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'N'
  return (
    <Link
      href={`/u/${ntlId}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{name}</span>
        {label && <span className="block truncate text-xs text-slate-600">{label}</span>}
        <span className="block font-mono text-[11px] text-slate-500">{ntlId}</span>
      </span>
    </Link>
  )
}
