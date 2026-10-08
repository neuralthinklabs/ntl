import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { GoalSprite } from '@/components/ntldgs/goal-icon'
import { Orbit } from '@/components/ntldgs/orbit'
import { NtldgsExplorer } from '@/components/ntldgs/explorer'
import { SystemSection } from '@/components/ntldgs/system-section'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'

type SearchParams = Promise<{ goal?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { goal: slug } = await searchParams
  const i = goalIndexBySlug(slug)
  if (i >= 0) {
    const g = goals[i]
    return { title: `${g.verb}: ${g.title} — NTLDGs — Neural Think Labs`, description: g.question }
  }
  return {
    title: 'The 12 NTLDGs — Neural Think Labs',
    description: 'A better life, a stronger society, and a future worth inheriting. Twelve goals, one connected system.',
  }
}

export default async function NtldgsPage({ searchParams }: { searchParams: SearchParams }) {
  const { goal } = await searchParams
  const initialIndex = Math.max(0, goalIndexBySlug(goal))

  return (
    <SiteShell>
      <GoalSprite />
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
          <div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Human Flourishing
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
              A better life, a stronger society, and a future worth inheriting.
            </p>
            <p className="mt-3 font-semibold text-white">
              Not just a better tomorrow. A more capable humanity.
            </p>
            <a href="#goals" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
              Explore the 12 goals <ArrowRight className="size-4" />
            </a>
          </div>
          <Orbit className="mx-auto w-full max-w-sm" />
        </div>
      </section>

      <NtldgsExplorer initialIndex={initialIndex} />
      <SystemSection />

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl bg-ink px-6 py-12 text-center sm:px-10">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to build a more flourishing future?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            See how the 12 goals connect. Be part of the journey.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/problems" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
              Submit a problem <ArrowRight className="size-4" />
            </Link>
            <Link href="/volunteer" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Volunteer
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
