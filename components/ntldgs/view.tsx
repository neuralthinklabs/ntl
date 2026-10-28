import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { GoalSprite } from './goal-icon'
import { Orbit } from './orbit'
import { DotGrid } from '@/components/brand/graphics'
import { NtldgsExplorer } from './explorer'
import { SystemSection } from './system-section'
import { SectionLabel } from '@/components/site/ui'
import { goals } from '@/lib/ntldgs'
import { getStoriesForGoal } from '@/lib/stories'
import { getGoalsForNtldg } from '@/lib/goals'
import { percentFunded } from '@/lib/goals'
import { money } from '@/lib/format'

async function Related({ slug }: { slug: string }) {
  const [stories, campaigns] = await Promise.all([getStoriesForGoal(slug), getGoalsForNtldg(slug)])
  if (!stories.length && !campaigns.length) return null
  return (
    <div className="mt-8 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:grid-cols-2">
      {campaigns.length > 0 && (
        <div>
          <SectionLabel>Campaigns for this goal</SectionLabel>
          <ul className="mt-3 flex flex-col gap-2">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/goals/${c.slug}`} className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                  <span className="block text-sm font-semibold text-ink">{c.title}</span>
                  <span className="text-xs text-slate-600">{money(c.fundingRaisedCents)} raised · {percentFunded(c)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {stories.length > 0 && (
        <div>
          <SectionLabel>Stories for this goal</SectionLabel>
          <ul className="mt-3 flex flex-col gap-2">
            {stories.map((s) => (
              <li key={s.slug}>
                <Link href={`/stories/${s.slug}`} className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                  <span className="block text-sm font-semibold text-ink">{s.title}</span>
                  <span className="text-xs text-slate-600">{s.category} · {s.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function NtldgsView({ slug }: { slug: string }) {
  const initialIndex = Math.max(0, goals.findIndex((g) => g.slug === slug))
  return (
    <SiteShell>
      <GoalSprite />
      <section className="relative overflow-hidden bg-ink text-white">
        <div aria-hidden className="bg-hero-glow absolute inset-0" />
        <DotGrid className="absolute inset-0 text-white/10 [mask-image:linear-gradient(to_right,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
          <div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">Human Flourishing</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">A better life, a stronger society, and a future worth inheriting.</p>
            <p className="mt-3 font-semibold text-white">Not just a better tomorrow. A more capable humanity.</p>
            <a href="#goals" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
              Explore the 12 goals <ArrowRight className="size-4" />
            </a>
          </div>
          <Orbit className="mx-auto w-full max-w-sm" />
        </div>
      </section>

      <NtldgsExplorer initialIndex={initialIndex} related={<Related slug={goals[initialIndex].slug} />} />
      <SystemSection />

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl bg-ink px-6 py-12 text-center sm:px-10">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ready to build a more flourishing future?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">See how the 12 goals connect. Be part of the journey.</p>
          <div className="mt-7 flex justify-center">
            <Link href="/volunteer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:brightness-110">
                Become a volunteer <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
