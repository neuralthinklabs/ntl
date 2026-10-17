import Link from 'next/link'

export function AuthorBio({ name, ntlId, bio }: { name: string; ntlId: string; bio: string | null }) {
  const initials = name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'N'
  return (
    <aside aria-label="About the author" className="mt-14 flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Written by</p>
        <p className="mt-0.5 text-base font-semibold text-ink">
          <Link href={`/u/${ntlId}`} className="underline-offset-2 hover:underline">{name}</Link>
        </p>
        {bio && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{bio}</p>}
      </div>
    </aside>
  )
}
