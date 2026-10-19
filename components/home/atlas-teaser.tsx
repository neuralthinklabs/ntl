import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/site/ui'
import { ATLAS_LEVELS, LEVEL_PLURAL, type AtlasLevel } from '@/lib/atlas-constants'
import { btnPrimary } from '@/lib/ui'

const blurb: Record<AtlasLevel, string> = {
  zone: 'The major geographic divisions.',
  subzone: 'Regions within each zone.',
  cluster: 'Local groupings of communities.',
}

export function AtlasTeaser({ counts }: { counts: Record<AtlasLevel, number> }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <SectionHeading
            label="NTL Atlas"
            title="Explore the geography of our work"
            description="Zones, subzones and clusters: see each area's communities, challenges, resources and what NTL is doing there."
          />
          <Link href="/atlas" className={`${btnPrimary} mt-8`}>
            Open the Atlas <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {ATLAS_LEVELS.map((l) => (
            <li key={l}>
              <Link href={`/atlas?level=${l}`} className="block h-full rounded-3xl border border-line bg-gradient-to-br from-white via-white to-brand-soft p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand/10">
                <span className="text-gradient text-3xl font-semibold">{counts[l]}</span>
                <span className="mt-1 block text-sm font-semibold text-ink">{LEVEL_PLURAL[l]}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-600">{blurb[l]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
