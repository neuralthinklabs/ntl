import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, HandHeart, Share2, Users } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { ProgressBar, SectionLabel } from '@/components/site/ui'
import { getAllGoals, percentFunded } from '@/lib/goals'
import { money } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Support our work',
  description: 'Help us turn ideas into real projects, products and impact.',
}

const otherWays = [
  { icon: Users, title: 'Volunteer', text: 'Share your time and skills.', href: '/volunteer' },
  { icon: HandHeart, title: 'Partner', text: 'Work with us on shared goals.', href: '/contact' },
  { icon: Share2, title: 'Spread the word', text: 'Read and share our stories.', href: '/stories' },
]

export default async function SupportPage() {
  const goals = await getAllGoals()

  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src="/images/support-plant.png" alt="" fill sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/50" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Support our work</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">Help us turn ideas into real projects, products and impact.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionLabel>Current campaigns</SectionLabel>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Pledge an amount to a campaign and we&apos;ll email you how to pay. A campaign&apos;s progress bar moves only after our team has confirmed your payment.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {goals.map((g) => {
            const percent = percentFunded(g)
            return (
              <article key={g.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-ink">{g.title}</h3>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
                    <span className="text-ink">{money(g.fundingRaisedCents)}</span>
                    <span>{percent}% of {money(g.fundingTargetCents)}</span>
                  </div>
                  <ProgressBar value={percent} label={`${g.title} funding progress`} />
                </div>
                <Link href={`/goals/${g.slug}`} className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
                  Support <ArrowRight className="size-4" />
                </Link>
              </article>
            )
          })}
          {goals.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              No campaigns yet. Check back soon.
            </p>
          )}
        </div>

        <div className="mt-16">
          <SectionLabel>Other ways to help</SectionLabel>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {otherWays.map((o) => (
              <Link key={o.title} href={o.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand-muted ring-1 ring-inset ring-brand/15">
                  <o.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{o.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{o.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
