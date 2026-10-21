import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { SectionLabel } from '@/components/site/ui'
import { UnitCard } from '@/components/atlas/unit-card'
import { CHILD_LEVEL, LEVEL_LABEL, LEVEL_PLURAL, getChildren, getTrail, getUnitByCode } from '@/lib/atlas'
import { formatDate } from '@/lib/datetime'

type Props = { params: Promise<{ code: string }> }
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const u = await getUnitByCode(code)
  if (!u) return { title: 'Not found' }
  return { title: `${u.name} (${u.code}) · Atlas`, description: u.summary ?? undefined, alternates: { canonical: `/atlas/${u.code}` } }
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default async function AtlasUnitPage({ params }: Props) {
  const { code } = await params
  const unit = await getUnitByCode(code)
  if (!unit) notFound()
  const [trail, children] = await Promise.all([getTrail(unit), getChildren(unit.id)])
  const childLevel = CHILD_LEVEL[unit.level]
  const empty = !unit.demographics && !unit.problemDomains.length && !unit.resources.length && !unit.initiatives

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
            <li><Link href="/atlas" className="font-medium text-brand-muted hover:underline">Atlas</Link></li>
            {trail.map((t) => (
              <li key={t.id} className="flex items-center gap-1">
                <ChevronRight className="size-4 text-slate-600" aria-hidden />
                <Link href={`/atlas/${t.code}`} className="font-medium text-brand-muted hover:underline">{t.name}</Link>
              </li>
            ))}
            <li className="flex items-center gap-1" aria-current="page">
              <ChevronRight className="size-4 text-slate-600" aria-hidden />
              <span className="text-ink">{unit.name}</span>
            </li>
          </ol>
        </nav>

        <header className="mt-6">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-slate-600">{unit.code}</span>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-muted">{LEVEL_LABEL[unit.level]}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${unit.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {unit.verified ? 'Verified data' : 'Unverified: estimates and assessments'}
            </span>
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{unit.name}</h1>
          {unit.summary && <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">{unit.summary}</p>}
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {unit.demographics && <Block title="Demographics (aggregate)"><p className="whitespace-pre-wrap">{unit.demographics}</p></Block>}
          {unit.problemDomains.length > 0 && (
            <Block title="Problem domains">
              <ul className="flex flex-wrap gap-2">
                {unit.problemDomains.map((d) => <li key={d} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{d}</li>)}
              </ul>
            </Block>
          )}
          {unit.resources.length > 0 && (
            <Block title="Resources and assets">
              <ul className="list-disc space-y-1 pl-5 marker:text-brand">{unit.resources.map((r) => <li key={r}>{r}</li>)}</ul>
            </Block>
          )}
          {unit.initiatives && <Block title="NTL activity"><p className="whitespace-pre-wrap">{unit.initiatives}</p></Block>}
          {empty && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">This profile is still being compiled.</p>}
        </div>

        {childLevel && (
          <section className="mt-12">
            <SectionLabel>{LEVEL_PLURAL[childLevel]} in {unit.name}</SectionLabel>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((c) => <UnitCard key={c.id} code={c.code} name={c.name} level={c.level} summary={c.summary} />)}
              {children.length === 0 && <p className="col-span-full text-sm text-slate-600">None published yet.</p>}
            </div>
          </section>
        )}

        <p className="mt-12 text-xs text-slate-600">
          Last updated {formatDate(unit.lastUpdated)}
          {unit.dataSources ? <> · Sources: {unit.dataSources}</> : null}
        </p>
      </div>
    </SiteShell>
  )
}
