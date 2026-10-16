import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { SectionLabel } from '@/components/site/ui'
import { getPublicProfile } from '@/lib/credits'
import { formatDate } from '@/lib/datetime'

type Props = { params: Promise<{ ntlId: string }> }

// Opt-in public pages: kept out of search engines.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ntlId } = await params
  const p = await getPublicProfile(ntlId)
  return { title: p ? p.name : 'Profile not found', robots: { index: false, follow: false } }
}

export default async function PublicProfilePage({ params }: Props) {
  const { ntlId } = await params
  const p = await getPublicProfile(ntlId)
  if (!p) notFound()

  const initials = p.name.split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'N'

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex items-center gap-5">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-brand-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink">{p.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-mono">{p.ntlId}</span>
              {p.roleLabel && <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-muted">{p.roleLabel}</span>}
            </p>
          </div>
        </div>

        {p.bio && <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-slate-700">{p.bio}</p>}

        {p.projects.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Projects</SectionLabel>
            <ul className="mt-4 flex flex-col gap-2">
              {p.projects.map((g) => (
                <li key={g.slug}>
                  <Link href={`/goals/${g.slug}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                    <span className="text-sm font-semibold text-ink">{g.title}</span>
                    <span className="shrink-0 text-xs text-slate-600">{g.roleLabel}</span>
                  </Link>
                </li>
              ))}
            {p.portfolio.length > 0 && (
              <section className="mt-12">
                <SectionLabel>Portfolio</SectionLabel>
                <ul className="mt-4 flex flex-col gap-2">
                  {p.portfolio.map((x) => (
                    <li key={x.name}>
                      <Link href="/portfolio" className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                        <span className="text-sm font-semibold text-ink">{x.name}</span>
                        <span className="shrink-0 text-xs text-slate-600">{x.roleLabel}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            // and change the empty-state condition to:
            // p.projects.length === 0 && p.portfolio.length === 0 && p.posts.length === 0
            </ul>
          </section>
        )}

        {p.posts.length > 0 && (
          <section className="mt-12">
            <SectionLabel>Writing</SectionLabel>
            <ul className="mt-4 flex flex-col gap-2">
              {p.posts.map((s) => (
                <li key={s.slug}>
                  <Link href={`/stories/${s.slug}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                    <span className="text-sm font-semibold text-ink">{s.title}</span>
                    {s.publishedAt && <span className="shrink-0 text-xs text-slate-600">{formatDate(s.publishedAt)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.projects.length === 0 && p.posts.length === 0 && (
          <p className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Nothing credited yet.
          </p>
        )}
      </div>
    </SiteShell>
  )
}
