import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Globe, HeartHandshake, Sparkles } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { IconTile, SectionLabel } from '@/components/site/ui'

export const metadata: Metadata = { title: 'Volunteer', description: 'Your skills can help solve real problems.' }

const why = [
  { icon: HeartHandshake, title: 'Make a real impact', text: 'Work on meaningful projects that matter to real communities.' },
  { icon: Sparkles, title: 'Build your skills', text: 'Gain experience and new perspectives across disciplines.' },
  { icon: Globe, title: 'Join a global community', text: 'Connect with people who share your values.' },
]

const steps = [
  { title: 'Fill out the application form', text: 'Takes about 5–10 minutes.' },
  { title: 'Our team reviews your application', text: 'We will be in touch within 1–2 weeks.' },
  { title: 'Get started', text: 'Join the team and make an impact.' },
]

export default function VolunteerPage() {
  const formUrl = process.env.NEXT_PUBLIC_VOLUNTEER_FORM_URL

  return (
    <SiteShell>
      <PageHero title="Volunteer" description="Your skills can help solve real problems." image="/images/volunteer-hands.png" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionLabel>Why volunteer?</SectionLabel>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {why.map((w) => (
            <div key={w.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="flex justify-center"><IconTile icon={w.icon} className="size-12" /></div>
              <h3 className="mt-4 text-base font-semibold text-ink">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{w.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>How it works</SectionLabel>
            <ol className="mt-6 flex flex-col gap-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl bg-ink p-8 text-white">
            <h3 className="text-xl font-semibold tracking-tight">Ready to get involved?</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">Apply now and our team will match you with a project that fits your skills and interests.</p>
            {formUrl ? (
              <a href={formUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
                Apply now <ArrowRight className="size-4" />
              </a>
            ) : (
              <Link href="/contact" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
                Tell us you&apos;re interested <ArrowRight className="size-4" />
              </Link>
            )}
            <p className="mt-6 text-sm text-white/75">
              Have questions? Read the{' '}
              <Link href="/faq" className="font-medium text-brand underline">FAQ</Link> or{' '}
              <Link href="/contact" className="font-medium text-brand underline">contact us</Link>.
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
