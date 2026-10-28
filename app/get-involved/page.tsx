import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, FileText, HandCoins, Handshake, Megaphone, Users, type LucideIcon } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { IconTile, SectionLabel } from '@/components/site/ui'
import { btnPrimary } from '@/lib/ui'
import { DotGrid, GeoShapes } from '@/components/brand/graphics'

export const metadata: Metadata = {
  title: 'Get involved',
  description: 'Submit a problem, volunteer, back a campaign, join an event or partner with Neural Think Labs.',
  alternates: { canonical: '/get-involved' },
}

type Way = { icon: LucideIcon; title: string; text: string; href: string; cta: string }

const main: Way = {
  icon: FileText,
  title: 'Submit a problem',
  text: 'Describe a real problem with context and evidence. Our team reviews it within 1–2 weeks and keeps you updated by email.',
  href: '/problems',
  cta: 'Submit a problem',
}

const ways: Way[] = [
  { icon: Users, title: 'Volunteer', text: 'Share your time and skills. We match volunteers to projects.', href: '/volunteer', cta: 'Apply to volunteer' },
  { icon: HandCoins, title: 'Back a campaign', text: 'Pledge to a campaign. Progress only moves once a payment is confirmed.', href: '/support', cta: 'See campaigns' },
  { icon: CalendarDays, title: 'Join an event', text: 'Workshops, talks and meetups, online and in person.', href: '/events', cta: 'View events' },
  { icon: Handshake, title: 'Partner with us', text: 'Organisations, researchers and funders working on shared goals.', href: '/contact', cta: 'Get in touch' },
  { icon: Megaphone, title: 'Spread the word', text: 'Read and share stories from the community.', href: '/stories', cta: 'Read stories' },
]

export default function GetInvolvedPage() {
  return (
    <SiteShell>
      <PageHero
        title="Get involved"
        description="There is more than one way to help. Pick the one that fits your time, skills and resources."
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <section className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-12">
          <div aria-hidden="true" className="bg-hero-glow absolute inset-0" />
          <DotGrid className="absolute inset-0 text-white/10" />
          <GeoShapes className="absolute -right-6 -top-6 hidden w-40 stroke-white opacity-25 md:block" />
          <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <IconTile icon={main.icon} className="size-14" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Start here</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{main.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{main.text}</p>
            </div>
            <Link href={main.href} className={btnPrimary}>
              {main.cta} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <div className="mt-14">
          <SectionLabel>Other ways to help</SectionLabel>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ways.map((w) => (
              <li key={w.title}>
                <Link
                  href={w.href}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <IconTile icon={w.icon} />
                  <h3 className="mt-4 text-base font-semibold text-ink">{w.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{w.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-muted">
                    {w.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 text-sm text-slate-600">
          Not sure where to start? Read the <Link href="/faq" className="font-medium text-brand-muted underline">FAQ</Link> or{' '}
          <Link href="/contact" className="font-medium text-brand-muted underline">ask us</Link>.
        </p>
      </div>
    </SiteShell>
  )
}
